from uuid import uuid4

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase


class PlatformStatsTests(APITestCase):
    def setUp(self):
        self.email = f"admin_{uuid4().hex[:8]}@example.com"
        self.user = User.objects.create_superuser(
            username="admin", password="password", email=self.email
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_get_platform_stats(self):
        url = reverse("platform-stats-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
