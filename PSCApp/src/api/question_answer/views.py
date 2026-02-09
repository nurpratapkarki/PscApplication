from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from src.api.permissions import IsOwnerOrReadOnly
from src.api.question_answer.serializers import (
    QuestionReportSerializer,
    QuestionSerializer,
)
from src.models.question_answer import Question, QuestionReport


class QuestionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Questions.
    Users can read public questions.
    Users can create questions (contribution).
    Users can update/delete their own questions if not public (checked in permission or perform_update).
    """

    queryset = Question.objects.filter(status="PUBLIC").order_by("-created_at")
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["category", "difficulty_level", "question_type"]
    search_fields = ["question_text_en", "question_text_np"]
    ordering_fields = ["created_at", "times_attempted", "times_correct"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def get_queryset(self):
        # Allow users to see their own non-public questions
        if self.request.user.is_authenticated:
            return Question.objects.filter(status="PUBLIC") | Question.objects.filter(
                created_by=self.request.user
            )
        return Question.objects.filter(status="PUBLIC")

    @action(detail=True, methods=["post"])
    def consent(self, request, pk=None):
        """
        Give consent for publication.
        """
        question = self.get_object()
        if question.created_by != request.user:
            return Response(
                {"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN
            )

        question.consent_given = True
        question.save(update_fields=["consent_given"])
        return Response({"status": "consent given"})


class QuestionReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Question Reports.
    Users can create reports.
    Admins can view/manage.
    """

    queryset = QuestionReport.objects.all().order_by("-created_at")
    serializer_class = QuestionReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)

    def get_queryset(self):
        # Regular users should only see their own reports? Or maybe none?
        # Usually reports are fire-and-forget for users, but seeing history is good.
        if self.request.user.is_staff:
            return QuestionReport.objects.all()
        return QuestionReport.objects.filter(reported_by=self.request.user)
