from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from src.api.permissions import IsAdminOrReadOnly
from src.api.time_config.serializers import TimeConfigurationSerializer
from src.models.time_config import TimeConfiguration


class TimeConfigurationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Time Configurations. Admin-only write access.
    """

    queryset = TimeConfiguration.objects.filter(is_active=True)
    serializer_class = TimeConfigurationSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["branch", "sub_branch", "category"]
