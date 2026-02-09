from datetime import timedelta

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

from src.models.branch import Category
from src.models.user import User as CustomUser


class UserProgress(models.Model):
    """
    Tracks user performance per category
    Used for analytics and personalized recommendations
    """

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="category_progress"
    )
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="user_progress"
    )
    questions_attempted = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)
    accuracy_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.0,
        help_text="Auto-calculated from correct/attempted ratio",
    )
    average_time_seconds = models.IntegerField(
        null=True, blank=True, help_text="Average time per question in this category"
    )
    last_attempted_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Last time user attempted question from this category",
    )
    weak_topics = models.JSONField(
        null=True,
        blank=True,
        help_text="JSON array of specific sub-topics user struggles with",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_progress"
        verbose_name = "User Progress"
        verbose_name_plural = "User Progress Records"
        unique_together = [["user", "category"]]
        indexes = [
            models.Index(fields=["user", "accuracy_percentage"]),
            models.Index(fields=["category", "accuracy_percentage"]),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.category.name_en} ({self.accuracy_percentage}%)"

    def update_progress(self, is_correct, time_taken):
        # Update counts
        self.questions_attempted += 1
        if is_correct:
            self.correct_answers += 1

        # Recalculate accuracy
        if self.questions_attempted > 0:
            self.accuracy_percentage = (
                self.correct_answers / self.questions_attempted
            ) * 100

        # Update average time (cumulative moving average)
        if self.average_time_seconds is None:
            self.average_time_seconds = time_taken
        else:
            # New Avg = ((Old Avg * (N-1)) + New Val) / N
            total_seconds_before = self.average_time_seconds * (
                self.questions_attempted - 1
            )
            self.average_time_seconds = int(
                (total_seconds_before + time_taken) / self.questions_attempted
            )

        self.last_attempted_date = timezone.now()
        self.save()

    def analyze_weak_topics(self):
        # Logic: If accuracy is low, flag this category (or specific tags if available) as weak
        current_weak = self.weak_topics or []

        if self.accuracy_percentage < 40 and self.questions_attempted >= 5:
            if self.category.name_en not in current_weak:
                current_weak.append(self.category.name_en)
        elif self.accuracy_percentage > 60:
            if self.category.name_en in current_weak:
                current_weak.remove(self.category.name_en)

        self.weak_topics = current_weak
        self.save(update_fields=["weak_topics"])


class StudyCollection(models.Model):
    """
    User's personal question collections/playlists
    For organizing questions by topic, difficulty, or custom criteria
    """

    name = models.CharField(
        max_length=255,
        help_text="Collection name (e.g., 'My Weak Questions', 'Math Practice')",
    )
    description = models.TextField(
        null=True, blank=True, help_text="What this collection is for"
    )
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="study_collections"
    )
    is_private = models.BooleanField(
        default=True, help_text="Personal vs shareable collections"
    )
    questions = models.ManyToManyField(
        "Question",
        related_name="study_collections",
        blank=True,
        help_text="User's curated question list",
    )
    icon = models.CharField(
        max_length=50, null=True, blank=True, help_text="Icon identifier for UI"
    )
    color_code = models.CharField(
        max_length=7,
        null=True,
        blank=True,
        help_text="Hex color for UI (e.g., #FF5733)",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "study_collections"
        verbose_name = "Study Collection"
        verbose_name_plural = "Study Collections"
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["created_by", "is_private"]),
        ]

    def __str__(self):
        return f"{self.name} by {self.created_by.username}"

    def get_question_count(self):
        return self.questions.count()

    def add_questions(self, question_ids):
        self.questions.add(*question_ids)

    def remove_questions(self, question_ids):
        self.questions.remove(*question_ids)

    def share_collection(self):
        self.is_private = False
        self.save(update_fields=["is_private"])


class UserStatistics(models.Model):
    """
    Individual user achievement tracking
    Displays on user profile and personal dashboard
    """

    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name="statistics"
    )
    questions_contributed = models.IntegerField(
        default=0, help_text="Lifetime contributions"
    )
    questions_made_public = models.IntegerField(
        default=0, help_text="Approved contributions"
    )
    questions_answered = models.IntegerField(
        default=0, help_text="Total questions attempted (practice + tests)"
    )
    correct_answers = models.IntegerField(default=0, help_text="Total correct answers")
    mock_tests_completed = models.IntegerField(
        default=0, help_text="Number of completed mock tests"
    )
    study_streak_days = models.IntegerField(
        default=0, help_text="Current consecutive days active"
    )
    longest_streak = models.IntegerField(default=0, help_text="Personal best streak")
    last_activity_date = models.DateField(
        null=True, blank=True, help_text="Last date user was active"
    )
    badges_earned = models.JSONField(
        default=dict, help_text="Dictionary of achievement badges"
    )
    contribution_rank = models.IntegerField(
        null=True, blank=True, help_text="Rank among all contributors"
    )
    accuracy_rank = models.IntegerField(
        null=True, blank=True, help_text="Rank by overall accuracy"
    )
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_statistics"
        verbose_name = "User Statistics"
        verbose_name_plural = "User Statistics"
        indexes = [
            models.Index(fields=["contribution_rank"]),
            models.Index(fields=["accuracy_rank"]),
            models.Index(fields=["study_streak_days"]),
        ]

    def __str__(self):
        return f"{self.user.username} Stats"

    def update_streak(self):
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)

        if self.last_activity_date == today:
            return  # Already updated for today

        if self.last_activity_date == yesterday:
            self.study_streak_days += 1
        else:
            self.study_streak_days = 1  # Reset or start new

        if self.study_streak_days > self.longest_streak:
            self.longest_streak = self.study_streak_days

        self.last_activity_date = today
        self.save(
            update_fields=["study_streak_days", "longest_streak", "last_activity_date"]
        )

    def check_badge_eligibility(self):
        badges = self.badges_earned or {}
        awarded = False

        # Example Badges
        if "First Step" not in badges and self.questions_answered >= 1:
            badges["First Step"] = {
                "date": str(self.last_updated.date()),
                "desc": "Answered first question",
            }
            awarded = True

        if "Streak Master" not in badges and self.study_streak_days >= 7:
            badges["Streak Master"] = {
                "date": str(self.last_updated.date()),
                "desc": "7 day streak",
            }
            awarded = True

        if "Contributor" not in badges and self.questions_contributed >= 1:
            badges["Contributor"] = {
                "date": str(self.last_updated.date()),
                "desc": "Contributed a question",
            }
            awarded = True

        if awarded:
            self.badges_earned = badges
            self.save(update_fields=["badges_earned"])

    def get_accuracy_percentage(self):
        if self.questions_answered == 0:
            return 0.0
        return (self.correct_answers / self.questions_answered) * 100

    def get_badges_list(self):
        return self.badges_earned
