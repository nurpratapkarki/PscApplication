from uuid import uuid4

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from src.models.user_stats import UserStatistics


class UserStatsApiTests(APITestCase):
    def setUp(self):
        self.email = f"user_{uuid4().hex[:8]}@example.com"
        self.user = User.objects.create_user(
            username="user", password="password", email=self.email
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_get_my_stats(self):
        # Stats should be auto-created if not exists (handled in view)
        url = reverse("user-statistics-me")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(UserStatistics.objects.filter(user=self.user).exists())
