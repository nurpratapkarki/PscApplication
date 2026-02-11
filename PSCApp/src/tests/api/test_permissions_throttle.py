from uuid import uuid4

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from src.models.app_settings import AppSettings
from src.models.branch import Branch
from src.models.time_config import TimeConfiguration


class PermissionsTests(APITestCase):
    """Test custom permission classes on config endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.admin_email = f"admin_{uuid4().hex[:6]}@example.com"
        self.admin = User.objects.create_user(
            username="configadmin",
            password="testpass",
            email=self.admin_email,
            is_staff=True,
        )
        self.regular_email = f"user_{uuid4().hex[:6]}@example.com"
        self.regular_user = User.objects.create_user(
            username="configuser",
            password="testpass",
            email=self.regular_email,
        )
        AppSettings.objects.create(setting_key="test_perm", setting_value="val")
        self.branch = Branch.objects.create(name_en="Perm Branch", slug="perm-branch")
        TimeConfiguration.objects.create(
            branch=self.branch, standard_duration_minutes=60, questions_count=50
        )

    def test_anonymous_can_read_app_settings(self):
        url = reverse("appsettings-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_anonymous_can_read_time_config(self):
        url = reverse("timeconfiguration-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_regular_user_can_read_app_settings(self):
        self.client.force_authenticate(user=self.regular_user)
        url = reverse("appsettings-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_dashboard_requires_staff(self):
        """Dashboard views should require staff status"""
        url = reverse("dashboard:index")
        # Anonymous should be redirected to login
        response = self.client.get(url)
        self.assertIn(
            response.status_code,
            [status.HTTP_302_FOUND, status.HTTP_403_FORBIDDEN],
        )


class ThrottleConfigTests(APITestCase):
    """Test that rate limiting is properly configured."""

    def test_throttle_classes_configured(self):
        """Verify throttle classes are set in DRF settings"""
        from django.conf import settings

        drf_settings = settings.REST_FRAMEWORK
        self.assertIn("DEFAULT_THROTTLE_CLASSES", drf_settings)
        self.assertIn(
            "rest_framework.throttling.AnonRateThrottle",
            drf_settings["DEFAULT_THROTTLE_CLASSES"],
        )
        self.assertIn(
            "rest_framework.throttling.UserRateThrottle",
            drf_settings["DEFAULT_THROTTLE_CLASSES"],
        )

    def test_throttle_rates_configured(self):
        """Verify throttle rates are set"""
        from django.conf import settings

        rates = settings.REST_FRAMEWORK.get("DEFAULT_THROTTLE_RATES", {})
        self.assertIn("anon", rates)
        self.assertIn("user", rates)
        self.assertEqual(rates["anon"], "30/minute")
        self.assertEqual(rates["user"], "120/minute")

    def test_authenticated_user_can_make_requests(self):
        """Authenticated users should be able to make requests"""
        user = User.objects.create_user(
            username=f"throttleuser_{uuid4().hex[:6]}",
            password="testpass",
        )
        self.client.force_authenticate(user=user)
        AppSettings.objects.create(
            setting_key="auth_throttle_test", setting_value="v"
        )
        url = reverse("appsettings-list")

        for _ in range(5):
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
