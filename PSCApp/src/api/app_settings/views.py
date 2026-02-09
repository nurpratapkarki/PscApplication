from rest_framework import permissions, viewsets

from src.api.app_settings.serializers import AppSettingsSerializer
from src.models.app_settings import AppSettings


class AppSettingsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for App Settings.
    Exposes settings to the client.
    """

    queryset = AppSettings.objects.filter(is_active=True)
    serializer_class = AppSettingsSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "setting_key"
