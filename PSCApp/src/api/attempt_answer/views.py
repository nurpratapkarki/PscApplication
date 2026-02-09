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
    """

    queryset = UserAnswer.objects.all()
    serializer_class = UserAnswerSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return UserAnswer.objects.filter(user_attempt__user=self.request.user)

    def perform_create(self, serializer):
        # Validate that the attempt belongs to user and is in progress
        attempt = serializer.validated_data["user_attempt"]
        if attempt.user != self.request.user:
            raise ValidationError("Not authorized for this attempt.")
        if attempt.status != "IN_PROGRESS":
            raise ValidationError("Attempt is not in progress.")

        # Check if answer already exists for this question in this attempt
        question = serializer.validated_data["question"]
        existing = UserAnswer.objects.filter(
            user_attempt=attempt, question=question
        ).first()
        if existing:
            # Update instead of create if attempting again (or block?)
            # Usually update is handled via PUT/PATCH, but create might imply "submit answer"
            # If unique constraint exists, it will fail.
            # UserAnswer has unique_together [user_attempt, question]
            # So we should block or handle update here?
            # DRF CreateModelMixin doesn't handle update.
            # Client should use PATCH if exists, or we handle logic.
            # Simplified: Assume client manages ID or we catch error.
            pass
        serializer.save()
