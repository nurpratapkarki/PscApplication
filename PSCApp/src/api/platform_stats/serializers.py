from rest_framework import serializers

from src.models.platform_stats import PlatformStats


class PlatformStatsSerializer(serializers.ModelSerializer):
    top_contributor_name = serializers.CharField(
        source="top_contributor_this_month.profile.full_name", read_only=True
    )
    most_attempted_category_name = serializers.CharField(
        source="most_attempted_category.name_en", read_only=True
    )

    class Meta:
        model = PlatformStats
        fields = [
            "total_questions_public",
            "total_questions_pending",
            "total_contributions_this_month",
            "total_users_active",
            "total_mock_tests_taken",
            "total_answers_submitted",
            "questions_added_today",
            "top_contributor_this_month",
            "top_contributor_name",
            "most_attempted_category",
            "most_attempted_category_name",
            "last_updated",
        ]
        read_only_fields = fields  # All fields read only via API
