from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the snippet.
        # Assumes the model has a `user` attribute or `google_auth_user` based on context.
        # Adjusting for UserProfile which maps to google_auth_user
        if hasattr(obj, "google_auth_user"):
            return obj.google_auth_user == request.user
        if hasattr(obj, "user"):
            return obj.user == request.user
        if hasattr(obj, "created_by"):
            return obj.created_by == request.user
        return False


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Allows read access to anyone, but write access only to admin users.
    Use for system configuration endpoints (AppSettings, TimeConfiguration).
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


class CanModerate(permissions.BasePermission):
    """
    Permission for moderation dashboard operations.
    Requires the user to be staff (is_staff=True).
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_staff
