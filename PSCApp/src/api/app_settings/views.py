from rest_framework import viewsets

from src.api.app_settings.serializers import AppSettingsSerializer
from src.api.permissions import IsAdminOrReadOnly
from src.models.app_settings import AppSettings


class AppSettingsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for App Settings.
    Exposes settings to the client. Admin-only write access.
    """

    queryset = AppSettings.objects.filter(is_active=True)
    serializer_class = AppSettingsSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = "setting_key"
