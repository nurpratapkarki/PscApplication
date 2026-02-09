from uuid import uuid4

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase


class AnalyticsApiTests(APITestCase):
    def setUp(self):
        self.email = f"user_{uuid4().hex[:8]}@example.com"
        self.user = User.objects.create_user(
            username="user", password="password", email=self.email
        )
        self.admin_email = f"admin_{uuid4().hex[:8]}@example.com"
        self.admin = User.objects.create_superuser(
            username="admin", password="password", email=self.admin_email
        )
        self.client = APIClient()

    def test_daily_activity_permission(self):
        url = reverse("dailyactivity-list")

        # Public/User -> Forbidden
        self.client.force_authenticate(user=self.user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Admin -> OK
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
