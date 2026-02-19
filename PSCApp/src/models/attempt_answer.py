from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

from src.models.mocktest import MockTest
from src.models.question_answer import Answer, Question


class UserAttempt(models.Model):
    """
    Tracks individual test/practice sessions
    Records timing, score, and completion status
    """

    STATUS_CHOICES = [
        ("IN_PROGRESS", "In Progress"),
        ("COMPLETED", "Completed"),
        ("ABANDONED", "Abandoned"),
    ]

    MODE_CHOICES = [
        ("MOCK_TEST", "Mock Test"),
        ("PRACTICE", "Practice Mode"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="attempts")
    mock_test = models.ForeignKey(
        MockTest,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="user_attempts",
        help_text="null for practice mode",
    )
    start_time = models.DateTimeField(
        default=timezone.now, help_text="When user started the attempt"
    )
    end_time = models.DateTimeField(
        null=True, blank=True, help_text="When completed/submitted"
    )
    total_time_taken = models.IntegerField(
        null=True,
        blank=True,
        help_text="Total seconds spent (calculated on completion)",
    )
    score_obtained = models.DecimalField(max_digits=7, decimal_places=2, default=0)
    total_score = models.DecimalField(
        max_digits=7, decimal_places=2, help_text="Maximum possible score"
    )
    percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Calculated on completion",
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="IN_PROGRESS"
    )
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default="MOCK_TEST")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_attempts"
        verbose_name = "User Attempt"
        verbose_name_plural = "User Attempts"
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["mock_test", "status"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        test_name = self.mock_test.title_en if self.mock_test else "Practice"
        return f"{self.user.username} - {test_name} ({self.status})"

    def calculate_results(self):
        total_score = 0
        score_obtained = 0
        answered_score = 0

        # Pre-fetch marks if it's a mock test
        marks_map = {}
        if self.mock_test:
            for mq in self.mock_test.test_questions.all():
                marks_map[mq.question_id] = mq.marks_allocated
                total_score += mq.marks_allocated

        answers = self.user_answers.all()
        for ans in answers:
            # Default to 1 mark if not in map (e.g. practice mode or mapping error)
            question_score = marks_map.get(ans.question_id, 1)

            if not self.mock_test:
                # In practice mode, total score grows with questions attempted
                total_score += question_score

            if not ans.is_skipped:
                answered_score += question_score

            if ans.is_correct:
                score_obtained += question_score

        self.score_obtained = score_obtained
        self.total_score = total_score

        # Calculate accuracy based on answered questions only (not skipped)
        # This ensures fair leaderboard scoring
        if answered_score > 0:
            self.percentage = (score_obtained / answered_score) * 100
        else:
            self.percentage = 0.0

        if self.end_time and self.start_time:
            self.total_time_taken = int(
                (self.end_time - self.start_time).total_seconds()
            )

        self.save(
            update_fields=[
                "score_obtained",
                "total_score",
                "percentage",
                "total_time_taken",
            ]
        )

    def complete_attempt(self):
        if self.status != "COMPLETED":
            self.end_time = timezone.now()
            self.status = "COMPLETED"
            self.calculate_results()
            self.save()

    def get_time_remaining(self):
        if self.status != "IN_PROGRESS":
            return 0

        if self.mock_test and self.mock_test.duration_minutes:
            limit_seconds = self.mock_test.duration_minutes * 60
            elapsed = (timezone.now() - self.start_time).total_seconds()
            remaining = limit_seconds - elapsed
            return max(0, int(remaining))

        return None  # Unlimited time


class UserAnswer(models.Model):
    """
    Individual question responses within an attempt
    Tracks selected answer, correctness, and time taken
    """

    user_attempt = models.ForeignKey(
        UserAttempt, on_delete=models.CASCADE, related_name="user_answers"
    )
    question = models.ForeignKey(
        Question, on_delete=models.PROTECT, related_name="user_responses"
    )
    selected_answer = models.ForeignKey(
        Answer,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="user_selections",
        help_text="null if question was skipped",
    )
    is_correct = models.BooleanField(default=False)
    time_taken_seconds = models.IntegerField(
        null=True, blank=True, help_text="Time spent on this specific question"
    )
    is_skipped = models.BooleanField(default=False)
    is_marked_for_review = models.BooleanField(
        default=False, help_text="User flagged to revisit later"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(
        auto_now=True, help_text="Updated when user changes answer"
    )

    class Meta:
        db_table = "user_answers"
        verbose_name = "User Answer"
        verbose_name_plural = "User Answers"
        unique_together = [["user_attempt", "question"]]
        indexes = [
            models.Index(fields=["user_attempt", "is_correct"]),
            models.Index(fields=["question", "is_correct"]),
        ]

    def __str__(self):
        return f"Q{self.question.id} - {'Correct' if self.is_correct else 'Incorrect'}"

    def save(self, *args, **kwargs):
        # Auto-check correctness if answer is selected
        if self.selected_answer:
            self.is_correct = self.selected_answer.is_correct
            self.is_skipped = False
        else:
            self.is_skipped = True
            self.is_correct = False
        super().save(*args, **kwargs)
