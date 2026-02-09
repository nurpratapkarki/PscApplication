from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, viewsets

from src.api.time_config.serializers import TimeConfigurationSerializer
from src.models.time_config import TimeConfiguration


class TimeConfigurationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Time Configurations.
    """

    queryset = TimeConfiguration.objects.filter(is_active=True)
    serializer_class = TimeConfigurationSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["branch", "sub_branch", "category"]
