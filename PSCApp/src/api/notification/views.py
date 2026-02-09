from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from src.api.notification.serializers import NotificationSerializer
from src.models.notification import Notification


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Notifications.
    """

    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by(
            "-created_at"
        )

    @action(detail=True, methods=["patch"], url_path="read")
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.mark_as_read()
        return Response({"status": "read"})

    @action(detail=False, methods=["post"], url_path="read-all")
    def mark_all_as_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(
            is_read=True
        )
        return Response({"status": "all read"})

    @action(detail=False, methods=["get"], url_path="unread")
    def unread_count(self, request):
        count = Notification.get_unread_count(request.user)
        return Response({"unread_count": count})
