import csv
import io

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
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
        question = serializer.save(created_by=self.request.user)
        # Auto-create a Contribution record so the user's contributions are tracked
        from django.utils import timezone

        from src.models.analytics import Contribution

        Contribution.objects.get_or_create(
            user=self.request.user,
            question=question,
            defaults={
                "contribution_month": timezone.now().month,
                "contribution_year": timezone.now().year,
                "status": "PENDING",
            },
        )

    def get_queryset(self):
        # Allow users to see their own non-public questions
        if self.request.user.is_authenticated:
            return Question.objects.filter(status="PUBLIC") | Question.objects.filter(
                created_by=self.request.user
            )
        return Question.objects.filter(status="PUBLIC")

    @action(
        detail=False,
        methods=["post"],
        url_path="bulk-upload",
        parser_classes=[MultiPartParser],
    )
    def bulk_upload(self, request):
        """
        Upload questions in bulk from a CSV file.
        Expected CSV columns: question_text_en, question_text_np,
        explanation_en, explanation_np, difficulty_level, answers (JSON).
        """
        uploaded_file = request.FILES.get("file")
        category_id = request.data.get("category")

        if not uploaded_file or not category_id:
            return Response(
                {"detail": "file and category are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from src.models.branch import Category

        try:
            category = Category.objects.get(pk=category_id)
        except Category.DoesNotExist:
            return Response(
                {"detail": "Category not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        import json

        content = uploaded_file.read().decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))
        created = []
        errors = []

        for i, row in enumerate(reader, start=1):
            try:
                question = Question.objects.create(
                    question_text_en=row.get("question_text_en", ""),
                    question_text_np=row.get("question_text_np", ""),
                    explanation_en=row.get("explanation_en", ""),
                    explanation_np=row.get("explanation_np", ""),
                    difficulty_level=row.get("difficulty_level", "MEDIUM"),
                    category=category,
                    created_by=request.user,
                    status="DRAFT",
                )
                # Create answers if provided as JSON
                answers_raw = row.get("answers", "[]")
                if answers_raw:
                    from src.models.question_answer import Answer

                    for ans in json.loads(answers_raw):
                        Answer.objects.create(
                            question=question,
                            answer_text_en=ans.get("answer_text_en", ""),
                            answer_text_np=ans.get("answer_text_np", ""),
                            is_correct=ans.get("is_correct", False),
                        )
                created.append(question.pk)
            except Exception as e:
                errors.append(f"Row {i}: {e}")

        return Response(
            {
                "success": len(errors) == 0,
                "uploaded_count": len(created),
                "failed_count": len(errors),
                "errors": errors,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_400_BAD_REQUEST,
        )

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
