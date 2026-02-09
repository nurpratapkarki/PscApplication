from rest_framework import permissions, viewsets
from rest_framework.response import Response

from src.api.platform_stats.serializers import PlatformStatsSerializer
from src.models.platform_stats import PlatformStats


class PlatformStatsViewSet(viewsets.ViewSet):
    """
    ViewSet for Platform Statistics.
    Publicly accessible.
    """

    permission_classes = [permissions.AllowAny]

    def list(self, request):
        stats, _ = PlatformStats.objects.get_or_create(id=1)
        serializer = PlatformStatsSerializer(stats)
        return Response(serializer.data)
