from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from src.api.attempt_answer.serializers import (
    BulkAnswerSerializer,
    StartAttemptSerializer,
    UserAnswerSerializer,
    UserAttemptSerializer,
)
from src.api.permissions import IsOwnerOrReadOnly
from src.models.attempt_answer import UserAnswer, UserAttempt
from src.models.mocktest import MockTest
from src.models.question_answer import Answer, Question


class UserAttemptViewSet(viewsets.ModelViewSet):
    """
    ViewSet for UserAttempts.
    Manages starting, tracking, and submitting attempts.
    """

    serializer_class = UserAttemptSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "mode", "mock_test"]

    def get_queryset(self):
        return UserAttempt.objects.filter(user=self.request.user).order_by(
            "-created_at"
        )

    @action(detail=False, methods=["post"], url_path="start")
    def start_attempt(self, request):
        """
        Start a new attempt.
        Payload: { "mock_test_id": 1, "mode": "MOCK_TEST" }
        """
        serializer = StartAttemptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        mock_test_id = data.get("mock_test_id")
        mode = data.get("mode")

        mock_test = None
        if mock_test_id:
            mock_test = get_object_or_404(MockTest, pk=mock_test_id)

        # Check for existing in-progress attempt for this test?
        # Typically allowed multiple attempts, but maybe warn if one is active?
        # For now, just create new.

        attempt = UserAttempt.objects.create(
            user=request.user,
            mock_test=mock_test,
            mode=mode,
            status="IN_PROGRESS",
            start_time=timezone.now(),
            total_score=0,  # Initialize
        )
        return Response(
            UserAttemptSerializer(attempt).data, status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=["post"], url_path="submit")
    def submit_attempt(self, request, pk=None):
        """
        Finish and calculate results.
        """
        attempt = self.get_object()
        if attempt.status == "COMPLETED":
            return Response(
                {"detail": "Attempt already completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        attempt.complete_attempt()
        return Response(UserAttemptSerializer(attempt).data)

    @action(detail=True, methods=["get"], url_path="results")
    def get_results(self, request, pk=None):
        """
        Get detailed results with correct answers.
        """
        attempt = self.get_object()
        if attempt.status != "COMPLETED":
            return Response(
                {"detail": "Attempt not completed yet."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(UserAttemptSerializer(attempt).data)


class UserAnswerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for submitting answers individually.
    POST /api/answers/ acts as create-or-update (upsert) for the same
    (user_attempt, question) pair so users can change their answer.
    """

    queryset = UserAnswer.objects.all()
    serializer_class = UserAnswerSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return UserAnswer.objects.filter(user_attempt__user=self.request.user)

    def create(self, request, *args, **kwargs):
        """
        Override create to handle upsert: if an answer already exists for
        (user_attempt, question), update it instead of failing on unique constraint.
        """
        attempt_id = request.data.get("user_attempt")
        question_id = request.data.get("question")

        if not attempt_id or not question_id:
            return Response(
                {"detail": "user_attempt and question are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate ownership and attempt status
        try:
            attempt = UserAttempt.objects.get(pk=attempt_id)
        except UserAttempt.DoesNotExist as err:
            raise ValidationError("Attempt not found.") from err

        if attempt.user != request.user:
            raise ValidationError("Not authorized for this attempt.")
        if attempt.status != "IN_PROGRESS":
            raise ValidationError("Attempt is not in progress.")

        # Check if answer already exists — if so, update it
        existing = UserAnswer.objects.filter(
            user_attempt=attempt, question_id=question_id
        ).first()

        if existing:
            serializer = self.get_serializer(existing, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        # No existing answer — create new one
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk_create(self, request):
        """
        Bulk create or update answers for an attempt.
        POST /api/answers/bulk/
        Payload: { "answers": [{ user_attempt, question, selected_answer, ... }, ...] }
        """
        serializer = BulkAnswerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        answers_data = serializer.validated_data["answers"]

        # Validate attempt ownership and status
        attempt_id = answers_data[0]["user_attempt"]
        try:
            attempt = UserAttempt.objects.get(pk=attempt_id)
        except UserAttempt.DoesNotExist as err:
            raise ValidationError({"detail": "Attempt not found."}) from err

        if attempt.user != request.user:
            raise ValidationError({"detail": "Not authorized for this attempt."})

        if attempt.status != "IN_PROGRESS":
            raise ValidationError({"detail": "Attempt is not in progress."})

        # Pre-validate all question and answer IDs exist
        question_ids = {item["question"] for item in answers_data}
        existing_questions = set(
            Question.objects.filter(pk__in=question_ids).values_list("pk", flat=True)
        )
        missing_questions = question_ids - existing_questions
        if missing_questions:
            raise ValidationError(
                {"detail": f"Questions not found: {missing_questions}"}
            )

        selected_answer_ids = {
            item["selected_answer"]
            for item in answers_data
            if item.get("selected_answer") is not None
        }
        if selected_answer_ids:
            existing_answers = set(
                Answer.objects.filter(pk__in=selected_answer_ids).values_list(
                    "pk", flat=True
                )
            )
            missing_answers = selected_answer_ids - existing_answers
            if missing_answers:
                raise ValidationError(
                    {"detail": f"Answers not found: {missing_answers}"}
                )

        # Pre-fetch answer correctness in one query to avoid N+1
        answer_correctness_map = {}
        if selected_answer_ids:
            answer_correctness_map = dict(
                Answer.objects.filter(pk__in=selected_answer_ids).values_list(
                    "pk", "is_correct"
                )
            )

        result_answers = []
        with transaction.atomic():
            for item in answers_data:
                selected_answer_id = item.get("selected_answer")
                defaults = {
                    "selected_answer_id": selected_answer_id,
                    "time_taken_seconds": item.get("time_taken_seconds"),
                    "is_skipped": item.get("is_skipped", False),
                    "is_marked_for_review": item.get("is_marked_for_review", False),
                }
                # Auto-calculate is_correct from pre-fetched map
                if selected_answer_id and selected_answer_id in answer_correctness_map:
                    defaults["is_correct"] = answer_correctness_map[selected_answer_id]
                    defaults["is_skipped"] = False
                else:
                    defaults["is_correct"] = False
                    if not selected_answer_id:
                        defaults["is_skipped"] = True

                user_answer, _created = UserAnswer.objects.update_or_create(
                    user_attempt=attempt,
                    question_id=item["question"],
                    defaults=defaults,
                )
                result_answers.append(user_answer)

        output_serializer = UserAnswerSerializer(result_answers, many=True)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
