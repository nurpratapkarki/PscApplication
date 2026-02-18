import re
import secrets

from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from dj_rest_auth.utils import jwt_encode
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.core.cache import cache
from django.core.mail import send_mail
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
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


class ForgotPasswordView(APIView):
    """
    POST /api/auth/forgot-password/
    Accepts: { email }
    Generates a 6-digit OTP, stores in cache (10 min), emails it.
    In development, OTP is also returned in the response.
    """

    permission_classes = (AllowAny,)
    authentication_classes = []

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        if not email:
            return Response({"detail": "Email is required."}, status=400)

        # Always return success to prevent email enumeration
        success_msg = {
            "detail": "If an account with that email exists, a reset code has been sent."
        }

        try:
            User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(success_msg)

        # Generate 6-digit OTP
        otp = f"{secrets.randbelow(1000000):06d}"
        cache_key = f"password_reset_otp:{email}"
        cache.set(cache_key, otp, timeout=600)  # 10 minutes

        # Send email
        send_mail(
            subject="PSC App - Password Reset Code",
            message=f"Your password reset code is: {otp}\n\nThis code expires in 10 minutes.",
            from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, "DEFAULT_FROM_EMAIL") else "noreply@pscapp.com",
            recipient_list=[email],
            fail_silently=True,
        )

        response_data = dict(success_msg)
        # In development, include OTP in response for easy testing
        if settings.DEBUG:
            response_data["otp"] = otp

        return Response(response_data)


class VerifyOTPView(APIView):
    """
    POST /api/auth/verify-otp/
    Accepts: { email, otp }
    Returns: { detail, reset_token } — a one-time token for the reset step.
    """

    permission_classes = (AllowAny,)
    authentication_classes = []

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        otp = (request.data.get("otp") or "").strip()

        if not email or not otp:
            return Response(
                {"detail": "Email and OTP are required."}, status=400
            )

        cache_key = f"password_reset_otp:{email}"
        stored_otp = cache.get(cache_key)

        if stored_otp is None or stored_otp != otp:
            return Response({"detail": "Invalid or expired code."}, status=400)

        # OTP is valid — generate a reset token
        reset_token = secrets.token_urlsafe(32)
        cache.set(f"password_reset_token:{email}", reset_token, timeout=600)
        cache.delete(cache_key)  # OTP is single-use

        return Response({
            "detail": "Code verified successfully.",
            "reset_token": reset_token,
        })


class ResetPasswordView(APIView):
    """
    POST /api/auth/reset-password/
    Accepts: { email, reset_token, new_password1, new_password2 }
    """

    permission_classes = (AllowAny,)
    authentication_classes = []

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        reset_token = (request.data.get("reset_token") or "").strip()
        new_password1 = request.data.get("new_password1", "")
        new_password2 = request.data.get("new_password2", "")

        if not all([email, reset_token, new_password1, new_password2]):
            return Response({"detail": "All fields are required."}, status=400)

        if new_password1 != new_password2:
            return Response({"detail": "Passwords do not match."}, status=400)

        if len(new_password1) < 8:
            return Response(
                {"detail": "Password must be at least 8 characters."}, status=400
            )

        # Verify reset token
        cache_key = f"password_reset_token:{email}"
        stored_token = cache.get(cache_key)

        if stored_token is None or stored_token != reset_token:
            return Response(
                {"detail": "Invalid or expired reset token."}, status=400
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=400)

        user.set_password(new_password1)
        user.save()
        cache.delete(cache_key)  # Token is single-use

        return Response({"detail": "Password has been reset successfully."})
