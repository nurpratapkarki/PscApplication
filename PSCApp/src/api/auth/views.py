from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from django.conf import settings
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = (
        getattr(settings, "GOOGLE_OAUTH_CALLBACK_URL", None)
        or "http://localhost:8000/accounts/google/login/callback/"
    )
    client_class = OAuth2Client


class DevLoginView(APIView):
    """
    Development-only view to simulate Google Login without actual Google interaction.
    Accepts an email/username and password, creates/gets a user, and returns tokens.
    """

    permission_classes = (AllowAny,)
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        # We handle logic manually, so APIView is cleaner.
        if not settings.DEBUG:
            return Response({"detail": "Not available in production"}, status=403)

        email = request.data.get("email")
        password = request.data.get("password")

        if not email:
            return Response({"detail": "Email required"}, status=400)

        from django.contrib.auth import get_user_model, authenticate

        User = get_user_model()

        # First, try to find an existing user by username or email
        user = User.objects.filter(username=email).first() or User.objects.filter(email=email).first()

        if user:
            # If password provided and user has usable password, authenticate
            if password and user.has_usable_password():
                authenticated_user = authenticate(username=user.username, password=password)
                if authenticated_user is None:
                    return Response({"detail": "Invalid credentials"}, status=401)
                user = authenticated_user
            # If no password provided or user doesn't have password, just use the found user (dev mode)
        else:
            # User doesn't exist, create a new one (dev mode behavior)
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password if password else None
            )
            if not password:
                user.set_unusable_password()
                user.save()

        from dj_rest_auth.utils import jwt_encode

        access_token, refresh_token = jwt_encode(user)

        data = {
            "user": {
                "pk": user.pk,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
            },
            "access": str(access_token),
            "refresh": str(refresh_token),
        }
        return Response(data)


class RegularLoginView(APIView):
    """
    Regular login view for users who signed up with username/password.
    """

    permission_classes = (AllowAny,)
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        email = request.data.get("email") or request.data.get("username")
        password = request.data.get("password")

        if not email or not password:
            return Response({"detail": "Email/username and password are required"}, status=400)

        from django.contrib.auth import get_user_model, authenticate

        User = get_user_model()

        # Find user by username or email
        user = User.objects.filter(username=email).first() or User.objects.filter(email=email).first()

        if not user:
            return Response({"detail": "No account found with this email/username"}, status=404)

        if not user.has_usable_password():
            return Response(
                {"detail": "This account uses Google Sign-In. Please login with Google."},
                status=400
            )

        # Authenticate with password
        authenticated_user = authenticate(username=user.username, password=password)
        if authenticated_user is None:
            return Response({"detail": "Invalid password"}, status=401)

        from dj_rest_auth.utils import jwt_encode

        access_token, refresh_token = jwt_encode(authenticated_user)

        data = {
            "user": {
                "pk": authenticated_user.pk,
                "username": authenticated_user.username,
                "email": authenticated_user.email,
                "first_name": authenticated_user.first_name,
                "last_name": authenticated_user.last_name,
            },
            "access": str(access_token),
            "refresh": str(refresh_token),
        }
        return Response(data)
