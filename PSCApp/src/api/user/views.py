from rest_framework import generics, permissions

# from django.contrib.auth import authenticate, login, logout # If using standard auth
# from src.api.permissions import IsOwnerOrReadOnly # Not strictly needed if we just return request.user
from src.api.user.serializers import UserProfileSerializer


class UserProfileDetailView(generics.RetrieveUpdateAPIView):
    """
    GET /api/auth/user/ - Get current user profile
    PATCH /api/auth/user/ - Update current user profile
    """

    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.profile
