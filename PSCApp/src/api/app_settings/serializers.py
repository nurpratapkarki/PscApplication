from rest_framework import serializers

from src.models.app_settings import AppSettings


class AppSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppSettings
        fields = ["setting_key", "setting_value", "description", "updated_at"]
        read_only_fields = fields
