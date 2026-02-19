from datetime import timedelta

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Count
from django.utils import timezone

from src.models.attempt_answer import UserAnswer, UserAttempt
from src.models.question_answer import Question
from src.models.user import User as CustomUser


class Contribution(models.Model):
    """
    Tracks user-contributed questions through approval process
    Monthly recognition and Facebook shoutouts
    """

    STATUS_CHOICES = [
        ("PENDING", "Pending Approval"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
        ("MADE_PUBLIC", "Made Public"),
    ]

    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="contributions"
    )
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="contribution_records"
    )
    contribution_month = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(12)],
        help_text="Month of contribution (1-12)",
    )
    contribution_year = models.IntegerField(help_text="Year of contribution")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    is_featured = models.BooleanField(
        default=False, help_text="Selected for Facebook shoutout"
    )
    approval_date = models.DateTimeField(
        null=True, blank=True, help_text="When the contribution was approved"
    )
    public_date = models.DateTimeField(
        null=True, blank=True, help_text="When made available to all users"
    )
    rejection_reason = models.TextField(
        null=True, blank=True, help_text="If rejected, explanation why"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "contributions"
        verbose_name = "Contribution"
        verbose_name_plural = "Contributions"
        unique_together = [["user", "question"]]
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["contribution_year", "contribution_month"]),
            models.Index(fields=["status", "is_featured"]),
        ]

    def __str__(self):
        return f"{self.user.username} - Q{self.question.id} ({self.status})"

    def approve_contribution(self):
        self.status = "APPROVED"
        self.approval_date = timezone.now()
        self.save()

    def reject_contribution(self, reason):
        self.status = "REJECTED"
        self.rejection_reason = reason
        self.save()

    def make_public(self):
        self.status = "MADE_PUBLIC"
        self.public_date = timezone.now()
        self.save()

        # Also update the actual question
        self.question.is_public = True
        self.question.status = "PUBLIC"
        self.question.save(update_fields=["is_public", "status"])

    def feature_for_social(self):
        self.is_featured = True
        self.save(update_fields=["is_featured"])

    @staticmethod
    def get_top_contributors(year, month, limit=10):
        return (
            CustomUser.objects.filter(
                contributions__contribution_year=year,
                contributions__contribution_month=month,
                contributions__status="MADE_PUBLIC",
            )
            .annotate(count=Count("contributions"))
            .order_by("-count")[:limit]
        )


class DailyActivity(models.Model):
    """
    Daily platform activity tracking for trend analysis
    Used for charts and growth metrics
    """

    date = models.DateField(unique=True, help_text="Date of activity tracking")
    new_users = models.IntegerField(default=0, help_text="New user registrations")
    questions_added = models.IntegerField(
        default=0, help_text="New questions added this day"
    )
    questions_approved = models.IntegerField(
        default=0, help_text="Questions approved by admins"
    )
    mock_tests_taken = models.IntegerField(
        default=0, help_text="Tests started this day"
    )
    total_answers_submitted = models.IntegerField(
        default=0, help_text="Question attempts across all users"
    )
    active_users = models.IntegerField(
        default=0, help_text="Unique users who performed any action"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "daily_activities"
        verbose_name = "Daily Activity"
        verbose_name_plural = "Daily Activities"
        ordering = ["-date"]
        indexes = [
            models.Index(fields=["date"]),
        ]

    def __str__(self):
        return f"Activity: {self.date}"

    @staticmethod
    def get_activity_range(start_date, end_date):
        return DailyActivity.objects.filter(
            date__range=[start_date, end_date]
        ).order_by("date")

    @staticmethod
    def get_trend_data(last_n_days=7):
        # Simplified to return last N days instead of aggregation logic

        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=last_n_days)
        return DailyActivity.get_activity_range(start_date, end_date)

    @staticmethod
    def record_today_activity():
        today = timezone.now().date()
        date_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)

        # Create or update record for today
        activity, created = DailyActivity.objects.get_or_create(date=today)

        # Update counts
        activity.new_users = CustomUser.objects.filter(
            date_joined__gte=date_start
        ).count()
        activity.questions_added = Question.objects.filter(
            created_at__gte=date_start
        ).count()
        activity.questions_approved = Question.objects.filter(
            updated_at__gte=date_start,
            status="PUBLIC",  # Approximate approval time
        ).count()
        activity.mock_tests_taken = UserAttempt.objects.filter(
            start_time__gte=date_start
        ).count()
        activity.total_answers_submitted = UserAnswer.objects.filter(
            created_at__gte=date_start
        ).count()

        # Active users approximation (users who logged in today)
        activity.active_users = CustomUser.objects.filter(
            last_login__gte=date_start
        ).count()

        activity.save()


class LeaderBoard(models.Model):
    """
    Tracks user rankings by time period, branch, and sub-branch
    Regenerated via scheduled cron jobs
    """

    TIME_PERIOD_CHOICES = [
        ("WEEKLY", "Weekly"),
        ("MONTHLY", "Monthly"),
        ("ALL_TIME", "All Time"),
    ]

    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="leaderboard_entries"
    )
    time_period = models.CharField(max_length=20, choices=TIME_PERIOD_CHOICES)
    branch = models.ForeignKey(
        "Branch", on_delete=models.CASCADE, related_name="leaderboard_entries"
    )
    sub_branch = models.ForeignKey(
        "SubBranch",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="leaderboard_entries",
        help_text="Leaderboard can be branch-wide or sub-branch specific",
    )
    rank = models.IntegerField(help_text="Current ranking position")
    previous_rank = models.IntegerField(
        null=True, blank=True, help_text="Rank from previous calculation"
    )
    total_score = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Sum of all test scores in this period",
    )
    tests_completed = models.IntegerField(
        default=0, help_text="Number of tests completed in this period"
    )
    accuracy_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, help_text="Overall accuracy in this period"
    )
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "leaderboards"
        verbose_name = "LeaderBoard Entry"
        verbose_name_plural = "LeaderBoard Entries"
        unique_together = [["user", "time_period", "branch", "sub_branch"]]
        ordering = ["time_period", "branch", "rank"]
        indexes = [
            models.Index(fields=["time_period", "branch", "rank"]),
            models.Index(fields=["user", "time_period"]),
        ]

    def __str__(self):
        return f"#{self.rank} - {self.user.username} ({self.get_time_period_display()})"

    @classmethod
    def update_score(cls, user, branch, score_delta):
        """
        Increment incrementally update scores for relevant leaderboards
        """
        item, _ = cls.objects.get_or_create(
            user=user,
            branch=branch,
            time_period="ALL_TIME",
            defaults={
                "rank": 0,
                "total_score": 0,
                "tests_completed": 0,
                "accuracy_percentage": 0,
            },
        )
        item.total_score += score_delta
        item.tests_completed += 1
        item.save(update_fields=["total_score", "tests_completed"])

    @staticmethod
    def recalculate_rankings(time_period, branch=None, sub_branch=None):
        from django.db.models import Avg, Count, Sum

        from src.models.attempt_answer import UserAttempt

        # 1. Determine Date Range
        end_date = timezone.now()
        start_date = None

        if time_period == "WEEKLY":
            start_date = end_date - timedelta(days=7)
        elif time_period == "MONTHLY":
            start_date = end_date - timedelta(days=30)
        # ALL_TIME implies no start_date (None)

        # 2. Fetch current rankings to cache previous rank
        params = {"time_period": time_period}
        if branch:
            params["branch"] = branch
        if sub_branch:
            params["sub_branch"] = sub_branch

        old_entries = LeaderBoard.objects.filter(**params)
        previous_ranks = {entry.user_id: entry.rank for entry in old_entries}

        # Clear old entries for this specific period/context
        old_entries.delete()

        # 3. Aggregation
        # Filter attempts — exclude attempts with zero answered questions
        attempts = UserAttempt.objects.filter(
            status="COMPLETED",
            user_answers__is_skipped=False,
        ).distinct()
        if start_date:
            attempts = attempts.filter(start_time__gte=start_date)

        # Filter by branch via MockTest relation
        # Note: Attempts filter by MockTest which is related to Branch
        if branch:
            attempts = attempts.filter(mock_test__branch=branch)
        if sub_branch:
            attempts = attempts.filter(mock_test__sub_branch=sub_branch)

        # Group by user and annotate
        user_scores = (
            attempts.values("user")
            .annotate(
                total_score=Sum("score_obtained"),
                tests_completed=Count("id"),
                avg_accuracy=Avg("percentage"),
            )
            .order_by("-total_score", "-avg_accuracy")
        )

        # 4. Bulk Create
        new_entries = []
        current_rank = 1

        # We need a branch instance for the foreign key.
        # If branch is None (e.g. Universal leaderboard not yet supported by schema fully, checking logic),
        # schema says branch is mandatory. So we fallback or raise error.
        # Assuming recalculate is called WITH a branch context as per schema constraint.
        if not branch:
            # If branch is None, we can't create LeaderBoard entries easily due to NOT NULL constraints
            # unless we pick a default or loop through all branches.
            # Ideally this method is called per branch.
            return

        for data in user_scores:
            user_id = data["user"]
            prev = previous_ranks.get(user_id)

            entry = LeaderBoard(
                user_id=user_id,
                time_period=time_period,
                branch=branch,
                sub_branch=sub_branch,
                rank=current_rank,
                previous_rank=prev,
                total_score=data["total_score"] or 0,
                tests_completed=data["tests_completed"] or 0,
                accuracy_percentage=data["avg_accuracy"] or 0,
            )
            new_entries.append(entry)
            current_rank += 1

        LeaderBoard.objects.bulk_create(new_entries)

    def get_rank_change(self):
        if self.previous_rank is None:
            return 0
        # Positive change implies moving UP the rank (e.g. 5 -> 2 is +3)
        # Negative change implies moving DOWN (e.g. 1 -> 4 is -3)
        return self.previous_rank - self.rank

    @staticmethod
    def get_top_users(time_period, branch, limit=10):
        qs = LeaderBoard.objects.filter(time_period=time_period)
        if branch:
            qs = qs.filter(branch=branch)
        return qs.order_by("rank")[:limit]
