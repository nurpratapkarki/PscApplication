from rest_framework import serializers

from src.models.analytics import Contribution, DailyActivity


class ContributionSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(
        source="question.question_text_en", read_only=True
    )
    user_name = serializers.CharField(source="user.profile.full_name", read_only=True)

    class Meta:
        model = Contribution
        fields = [
            "id",
            "user",
            "user_name",
            "question",
            "question_text",
            "contribution_month",
            "contribution_year",
            "status",
            "is_featured",
            "approval_date",
            "public_date",
            "rejection_reason",
            "created_at",
        ]
        read_only_fields = [
            "user",
            "question",
            "contribution_month",
            "contribution_year",
            "created_at",
        ]


class DailyActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyActivity
        fields = "__all__"
