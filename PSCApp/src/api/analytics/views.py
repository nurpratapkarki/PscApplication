from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from src.api.analytics.serializers import (
    ContributionSerializer,
    DailyActivitySerializer,
)
from src.models.analytics import Contribution, DailyActivity


class ContributionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Contributions.
    Users see their own. Admins see all.
    """

    queryset = Contribution.objects.all().order_by("-created_at")
    serializer_class = ContributionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status", "contribution_year", "contribution_month"]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Contribution.objects.all().order_by("-created_at")
        return Contribution.objects.filter(user=self.request.user).order_by(
            "-created_at"
        )

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        contribution = self.get_object()
        contribution.approve_contribution()
        return Response({"status": "approved"})

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        contribution = self.get_object()
        reason = request.data.get("reason", "No reason provided")
        contribution.reject_contribution(reason)
        return Response({"status": "rejected"})


class DailyActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Daily Activity (Admin Dashboard).
    """

    queryset = DailyActivity.objects.all().order_by("-date")
    serializer_class = DailyActivitySerializer
    permission_classes = [
        permissions.IsAdminUser
    ]  # Only admins should see raw stats? Or public?
    # PlatformStats is public aggregated. DailyActivity is detailed. Let's keep Admin.
