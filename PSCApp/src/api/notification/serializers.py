from rest_framework import serializers

from src.models.notification import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "notification_type",
            "title_en",
            "title_np",
            "message_en",
            "message_np",
            "related_question",
            "related_mock_test",
            "is_read",
            "action_url",
            "created_at",
        ]
        read_only_fields = [
            "notification_type",
            "title_en",
            "title_np",
            "message_en",
            "message_np",
            "related_question",
            "related_mock_test",
            "created_at",
        ]
