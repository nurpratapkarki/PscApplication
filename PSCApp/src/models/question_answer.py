from django.contrib.auth.models import User
from django.db import models

from src.models.branch import Category


class Question(models.Model):
    """
    Individual exam questions with bilingual support
    Tracks contribution status and public availability
    """

    DIFFICULTY_CHOICES = [
        ("EASY", "Easy"),
        ("MEDIUM", "Medium"),
        ("HARD", "Hard"),
    ]

    TYPE_CHOICES = [
        ("MCQ", "Multiple Choice Question"),
        # Future: TRUE_FALSE, FILL_BLANK, etc.
    ]

    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("PENDING_REVIEW", "Pending Review"),
        ("PUBLIC", "Public"),
        ("PRIVATE", "Private"),
    ]

    question_text_en = models.TextField(help_text="Question in English")
    question_text_np = models.TextField(help_text="Question in Nepali")
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="questions",
        help_text="Single category assignment",
    )
    difficulty_level = models.CharField(
        max_length=10,
        choices=DIFFICULTY_CHOICES,
        null=True,
        blank=True,
        help_text="Required only for IQ & Mathematics categories",
    )
    question_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="MCQ")
    explanation_en = models.TextField(
        help_text="Detailed explanation for correct answer in English"
    )
    explanation_np = models.TextField(help_text="Detailed explanation in Nepali")
    image = models.ImageField(
        upload_to="question_images/",
        null=True,
        blank=True,
        help_text="Optional diagram or chart",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="DRAFT")
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="contributed_questions",
        help_text="User who contributed this question",
    )
    is_public = models.BooleanField(default=False)
    consent_given = models.BooleanField(
        default=False, help_text="User agreed to make question public"
    )
    scheduled_public_date = models.DateField(
        null=True, blank=True, help_text="When question becomes public (monthly batch)"
    )
    source_reference = models.CharField(
        max_length=255, null=True, blank=True, help_text="e.g., 'PSC 2078 Nasu Exam'"
    )
    times_attempted = models.IntegerField(
        default=0, help_text="How many times this question was attempted"
    )
    times_correct = models.IntegerField(
        default=0, help_text="How many times answered correctly"
    )
    reported_count = models.IntegerField(
        default=0, help_text="Number of quality reports filed"
    )
    is_verified = models.BooleanField(default=False, help_text="Admin verified quality")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "questions"
        verbose_name = "Question"
        verbose_name_plural = "Questions"
        indexes = [
            models.Index(fields=["category", "status"]),
            models.Index(fields=["is_public", "status"]),
            models.Index(fields=["created_by", "status"]),
            models.Index(fields=["scheduled_public_date"]),
        ]

    def __str__(self):
        return f"Q{self.id}: {self.question_text_en[:50]}..."

    def get_accuracy_rate(self):
        if self.times_attempted == 0:
            return 0.0
        return (self.times_correct / self.times_attempted) * 100

    def get_attempt_history(self, user=None):
        qs = self.user_responses.select_related("user_attempt")
        if user:
            qs = qs.filter(user_attempt__user=user)
        return qs

    def check_duplicate(self):
        from django.db.models import Q

        return (
            Question.objects.filter(
                Q(question_text_en__iexact=self.question_text_en)
                | Q(question_text_np__iexact=self.question_text_np)
            )
            .exclude(id=self.id)
            .exists()
        )

    def schedule_publication(self, target_date):
        self.scheduled_public_date = target_date
        self.status = "PENDING_REVIEW"  # Ensure it's not public yet
        self.save(update_fields=["scheduled_public_date", "status"])


class Answer(models.Model):
    """
    Answer options for MCQ questions
    One question has multiple answers, only one is correct
    """

    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="answers"
    )
    answer_text_en = models.TextField(help_text="Answer option in English")
    answer_text_np = models.TextField(help_text="Answer option in Nepali")
    is_correct = models.BooleanField(
        default=False, help_text="Only one answer should be True per question"
    )
    display_order = models.IntegerField(
        default=0, help_text="Order for A, B, C, D display"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "answers"
        verbose_name = "Answer"
        verbose_name_plural = "Answers"
        ordering = ["question", "display_order"]
        unique_together = [["question", "display_order"]]

    def __str__(self):
        correct_mark = "✓" if self.is_correct else "✗"
        return f"{correct_mark} {self.answer_text_en[:30]}..."

    def clean(self):
        from django.core.exceptions import ValidationError

        if self.is_correct and self.question_id:
            # Check if another answer for this question is already correct
            # Exclude self to allow updating the current correct answer
            others = Answer.objects.filter(question=self.question, is_correct=True)
            if self.id:
                others = others.exclude(id=self.id)

            if others.exists():
                raise ValidationError(
                    "There can only be one correct answer per question."
                )


class QuestionReport(models.Model):
    """
    Community-driven quality control for questions
    Users can report issues with questions
    """

    REASON_CHOICES = [
        ("INCORRECT_ANSWER", "Incorrect Answer"),
        ("TYPO", "Typo/Grammar Error"),
        ("INAPPROPRIATE", "Inappropriate Content"),
        ("DUPLICATE", "Duplicate Question"),
        ("OTHER", "Other Issue"),
    ]

    STATUS_CHOICES = [
        ("PENDING", "Pending Review"),
        ("UNDER_REVIEW", "Under Review"),
        ("RESOLVED", "Resolved"),
        ("REJECTED", "Rejected"),
    ]

    question = models.ForeignKey(
        "Question", on_delete=models.CASCADE, related_name="reports"
    )
    reported_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="filed_reports"
    )
    reason = models.CharField(max_length=30, choices=REASON_CHOICES)
    description = models.TextField(help_text="Detailed explanation of the issue")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_reports",
        help_text="Admin or moderator who reviewed this report",
    )
    admin_notes = models.TextField(
        null=True, blank=True, help_text="Internal notes about resolution"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(
        null=True, blank=True, help_text="When the report was resolved"
    )

    class Meta:
        db_table = "question_reports"
        verbose_name = "Question Report"
        verbose_name_plural = "Question Reports"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["question", "status"]),
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["reported_by"]),
        ]

    def __str__(self):
        return f"Report #{self.id} - Q{self.question.id} ({self.get_reason_display()})"

    def resolve_report(self, admin_user, notes):
        self.status = "RESOLVED"
        self.reviewed_by = admin_user
        self.admin_notes = notes
        self.resolved_at = models.functions.Now()
        self.save()

    def notify_creator(self):
        from src.models.notification import Notification

        creator = self.question.created_by
        if creator:
            Notification.objects.create(
                user=creator,
                notification_type="REPORT_RESOLVED",
                title_en="Question Report Resolved",
                title_np="प्रश्न रिपोर्ट समाधान गरियो",
                message_en=f"A report on your question Q{self.question.id} has been reviewed.",
                message_np=f"तपाईंको प्रश्न Q{self.question.id} मा गरिएको रिपोर्ट समीक्षा गरिएको छ।",
                related_question=self.question,
            )

    @staticmethod
    def get_high_priority_questions():
        # Using the accumulated reported_count on Question model
        # Assuming reported_count is kept in sync via signals
        return Question.objects.filter(reported_count__gte=3, status="PUBLIC")
