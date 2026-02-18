from django.db import models

from src.models.user import User


class PlatformStats(models.Model):
    """
    Global platform statistics for public dashboard
    Shows community activity and engagement
    Singleton model - only one active record
    """

    total_questions_public = models.IntegerField(
        default=0, help_text="All approved public questions"
    )
    total_questions_pending = models.IntegerField(
        default=0, help_text="Waiting for monthly approval"
    )
    total_contributions_this_month = models.IntegerField(
        default=0, help_text="Contributions in current month (resets monthly)"
    )
    total_users_active = models.IntegerField(
        default=0, help_text="Users who contributed/attempted in last 30 days"
    )
    total_mock_tests_taken = models.IntegerField(
        default=0, help_text="All time test attempts"
    )
    total_answers_submitted = models.IntegerField(
        default=0, help_text="Total question attempts across platform"
    )
    questions_added_today = models.IntegerField(
        default=0, help_text="Questions added in last 24 hours"
    )
    top_contributor_this_month = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="top_contributor_stats",
    )
    most_attempted_category = models.ForeignKey(
        "Category",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="top_category_stats",
    )
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "platform_stats"
        verbose_name = "Platform Statistics"
        verbose_name_plural = "Platform Statistics"

    def __str__(self):
        return f"Platform Stats (Updated: {self.last_updated})"

    def refresh_stats(self):
        from datetime import timedelta

        from django.db.models import Count
        from django.utils import timezone

        from src.models.attempt_answer import UserAnswer, UserAttempt
        from src.models.question_answer import Question

        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        one_day_ago = now - timedelta(hours=24)

        self.total_questions_public = Question.objects.filter(status="PUBLIC").count()
        self.total_questions_pending = Question.objects.filter(
            status="PENDING_REVIEW"
        ).count()

        self.total_contributions_this_month = Question.objects.filter(
            created_at__year=now.year, created_at__month=now.month
        ).count()

        self.total_users_active = User.objects.filter(
            last_login__gte=thirty_days_ago
        ).count()
        self.total_mock_tests_taken = UserAttempt.objects.count()
        self.total_answers_submitted = UserAnswer.objects.count()

        self.questions_added_today = Question.objects.filter(
            created_at__gte=one_day_ago
        ).count()

        # Calculate top contributor
        top_contributor = (
            User.objects.filter(
                contributed_questions__created_at__year=now.year,
                contributed_questions__created_at__month=now.month,
            )
            .annotate(count=Count("contributed_questions"))
            .order_by("-count")
            .first()
        )
        self.top_contributor_this_month = top_contributor

        self.save()

    def reset_monthly_stats(self):
        self.total_contributions_this_month = 0
        self.questions_added_today = 0
        self.top_contributor_this_month = None
        self.save()

    @staticmethod
    def scheduled_update():
        obj, _ = PlatformStats.objects.get_or_create(id=1)
        obj.refresh_stats()
