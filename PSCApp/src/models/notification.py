import logging

from django.db import models

from src.models.user import User

logger = logging.getLogger(__name__)


class Notification(models.Model):
    """
    User alerts for contributions, leaderboard changes, etc.
    Keeps users engaged with the platform
    """

    TYPE_CHOICES = [
        ("CONTRIBUTION_APPROVED", "Contribution Approved"),
        ("QUESTION_PUBLIC", "Question Made Public"),
        ("LEADERBOARD_RANK", "Leaderboard Rank Change"),
        ("REPORT_RESOLVED", "Report Resolved"),
        ("STREAK_ALERT", "Streak Alert"),
        ("MILESTONE", "Milestone Achieved"),
        ("GENERAL", "General Notification"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications"
    )
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    title_en = models.CharField(
        max_length=255, help_text="Notification heading in English"
    )
    title_np = models.CharField(
        max_length=255, help_text="Notification heading in Nepali"
    )
    message_en = models.TextField(help_text="Notification body in English")
    message_np = models.TextField(help_text="Notification body in Nepali")
    related_question = models.ForeignKey(
        "Question",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
        help_text="If notification is about a specific question",
    )
    related_mock_test = models.ForeignKey(
        "MockTest",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )
    is_read = models.BooleanField(default=False)
    action_url = models.CharField(
        max_length=500,
        null=True,
        blank=True,
        help_text="Deep link for mobile app navigation",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read"]),
            models.Index(fields=["user", "notification_type"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.title_en}"

    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.save(update_fields=["is_read"])

    @staticmethod
    def create_bulk_notifications(
        users,
        notification_type,
        title_en,
        title_np,
        message_en,
        message_np,
        related_question=None,
        related_mock_test=None,
    ):
        notifications = [
            Notification(
                user=user,
                notification_type=notification_type,
                title_en=title_en,
                title_np=title_np,
                message_en=message_en,
                message_np=message_np,
                related_question=related_question,
                related_mock_test=related_mock_test,
            )
            for user in users
        ]
        Notification.objects.bulk_create(notifications)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            self.send_realtime()

    def send_realtime(self):
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer

        channel_layer = get_channel_layer()
        group_name = f"user_{self.user.id}"

        data = {
            "id": self.id,
            "type": self.notification_type,
            "title": self.title_en,  # Sending English title as default
            "message": self.message_en,
            "action_url": self.action_url,
            "created_at": self.created_at.isoformat(),
            "is_read": self.is_read,
        }

        try:
            async_to_sync(channel_layer.group_send)(
                group_name, {"type": "send_notification", "data": data}
            )
        except Exception as e:
            # Log error, don't crash main thread
            logger.warning("Failed to send realtime notification: %s", e)

    @staticmethod
    def get_unread_count(user):
        return Notification.objects.filter(user=user, is_read=False).count()
