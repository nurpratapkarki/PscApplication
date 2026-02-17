import re

from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from dj_rest_auth.utils import jwt_encode
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = (
        getattr(settings, "GOOGLE_OAUTH_CALLBACK_URL", None)
        or "http://localhost:8000/accounts/google/login/callback/"
    )
    client_class = OAuth2Client

class LoginView(APIView):
    """
    POST /api/auth/login/
    Accepts: { email, password }
    Returns: { access, refresh }
    
    Bypasses allauth entirely — authenticates directly against
    Django's auth backend, so users created without an EmailAddress
    record still work.
    """
    permission_classes = (AllowAny,)
    authentication_classes = []

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password", "")

        if not email or not password:
            return Response(
                {"detail": "Email and password are required."}, status=400
            )

        # Django's authenticate() checks password against the User model directly,
        # no allauth EmailAddress lookup involved
        user = authenticate(request, username=email, password=password)

        if user is None:
            # authenticate() can fail if username != email, try fetching user first
            try:
                db_user = User.objects.get(email=email)
                user = authenticate(request, username=db_user.username, password=password)
            except User.DoesNotExist:
                pass

        if user is None:
            return Response({"detail": "Invalid email or password."}, status=400)

        if not user.is_active:
            return Response({"detail": "This account is disabled."}, status=400)

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })

class RegisterView(APIView):
    """
    POST /api/auth/registration/
    Accepts: { email, password1, password2, full_name? }
    Returns: { access, refresh }
    """

    permission_classes = (AllowAny,)
    authentication_classes = []

    def post(self, request):
        email = (request.data.get("email") or "").strip()
        password1 = request.data.get("password1", "")
        password2 = request.data.get("password2", "")
        full_name = (request.data.get("full_name") or "").strip()

        # --- validation ---
        if not email:
            return Response({"detail": "Email is required."}, status=400)
        if not password1:
            return Response({"detail": "Password is required."}, status=400)
        if password1 != password2:
            return Response({"detail": "Passwords do not match."}, status=400)
        if len(password1) < 8:
            return Response(
                {"detail": "Password must be at least 8 characters."}, status=400
            )
        if User.objects.filter(email=email).exists():
            return Response(
                {"detail": "An account with this email already exists."}, status=400
            )

        # --- generate unique username from email prefix ---
        prefix = re.sub(r"[^\w]", "", email.split("@")[0])[:20] or "user"
        username = prefix
        n = 1
        while User.objects.filter(username=username).exists():
            username = f"{prefix}{n}"
            n += 1

        # --- parse full_name ---
        first_name, last_name = "", ""
        if full_name:
            parts = full_name.split(" ", 1)
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else ""

        # --- create user (signal auto-creates UserProfile) ---
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password1,
            first_name=first_name,
            last_name=last_name,
        )

        # --- return JWT tokens ---
        access_token, refresh_token = jwt_encode(user)
        return Response(
            {"access": str(access_token), "refresh": str(refresh_token)},
            status=201,
        )
