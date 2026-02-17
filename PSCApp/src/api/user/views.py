from rest_framework import generics, permissions

from src.api.user.serializers import UserProfileSerializer
from src.models.user import UserProfile


class UserProfileDetailView(generics.RetrieveUpdateAPIView):
    """
    GET /api/auth/user/ - Get current user profile
    PATCH /api/auth/user/ - Update current user profile
    """

    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        user = self.request.user
        profile, _ = UserProfile.objects.get_or_create(
            google_auth_user=user,
            defaults={
                "email": user.email,
                "full_name": f"{user.first_name} {user.last_name}".strip()
                or user.username,
            },
        )
        return profile
