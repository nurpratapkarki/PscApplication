from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from src.api.notification.serializers import NotificationSerializer
from src.models.notification import Notification
from src.models.user import UserProfile


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

    @action(detail=False, methods=["post"], url_path="register-push-token")
    def register_push_token(self, request):
        """Register an Expo push notification token for the current user."""
        token = request.data.get("token")
        if not token or not token.startswith("ExponentPushToken["):
            return Response(
                {"error": "Invalid Expo push token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile, _ = UserProfile.objects.get_or_create(
            google_auth_user=request.user,
            defaults={
                "email": request.user.email,
                "full_name": request.user.username,
            },
        )
        profile.expo_push_token = token
        profile.push_notifications_enabled = True
        profile.save(update_fields=["expo_push_token", "push_notifications_enabled"])

        return Response({"status": "registered", "token": token})

    @action(detail=False, methods=["post"], url_path="unregister-push-token")
    def unregister_push_token(self, request):
        """Remove the push token for the current user."""
        try:
            profile = request.user.profile
            profile.expo_push_token = None
            profile.save(update_fields=["expo_push_token"])
        except UserProfile.DoesNotExist:
            pass
        return Response({"status": "unregistered"})

    @action(detail=False, methods=["post"], url_path="send-push")
    def send_push(self, request):
        """
        Admin-only: Send a push notification to specific users or all users.

        Body:
          - title_en: str (required)
          - title_np: str (optional)
          - message_en: str (required)
          - message_np: str (optional)
          - user_ids: list[int] (optional, if omitted sends to all)
          - notification_type: str (optional, default "GENERAL")
        """
        if not request.user.is_staff:
            return Response(
                {"error": "Admin access required"},
                status=status.HTTP_403_FORBIDDEN,
            )

        title_en = request.data.get("title_en", "")
        title_np = request.data.get("title_np", "")
        message_en = request.data.get("message_en", "")
        message_np = request.data.get("message_np", "")
        notification_type = request.data.get("notification_type", "GENERAL")
        user_ids = request.data.get("user_ids")

        if not title_en or not message_en:
            return Response(
                {"error": "title_en and message_en are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.contrib.auth.models import User

        if user_ids:
            users = User.objects.filter(id__in=user_ids)
        else:
            users = User.objects.filter(is_active=True)

        # Create in-app notifications
        Notification.create_bulk_notifications(
            users=list(users),
            notification_type=notification_type,
            title_en=title_en,
            title_np=title_np or title_en,
            message_en=message_en,
            message_np=message_np or message_en,
        )

        # Send push notifications
        from src.services.push import send_bulk_push_notifications

        tokens = list(
            UserProfile.objects.filter(
                google_auth_user__in=users,
                push_notifications_enabled=True,
                expo_push_token__isnull=False,
            )
            .exclude(expo_push_token="")
            .values_list("expo_push_token", flat=True)
        )

        push_result = send_bulk_push_notifications(
            tokens=tokens,
            title=title_en,
            body=message_en,
            data={"type": notification_type},
        )

        return Response(
            {
                "status": "sent",
                "in_app_count": users.count(),
                "push_sent": push_result["sent"],
                "push_failed": push_result["failed"],
            }
        )
