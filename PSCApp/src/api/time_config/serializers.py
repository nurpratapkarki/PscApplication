from rest_framework import serializers

from src.models.time_config import TimeConfiguration


class TimeConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeConfiguration
        fields = [
            "id",
            "branch",
            "sub_branch",
            "category",
            "standard_duration_minutes",
            "questions_count",
            "description",
        ]
        read_only_fields = fields
