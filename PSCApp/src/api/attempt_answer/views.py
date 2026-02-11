from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from src.api.attempt_answer.serializers import (
    StartAttemptSerializer,
    UserAnswerSerializer,
    UserAttemptSerializer,
)
from src.api.permissions import IsOwnerOrReadOnly
from src.models.attempt_answer import UserAnswer, UserAttempt
from src.models.mocktest import MockTest


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
        except UserAttempt.DoesNotExist:
            raise ValidationError("Attempt not found.")

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
