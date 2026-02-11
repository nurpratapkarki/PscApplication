from uuid import uuid4

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase


class UserProfileTests(APITestCase):
    def setUp(self):
        self.email = f"test_{uuid4().hex[:8]}@example.com"
        self.user = User.objects.create_user(
            username="testuser", password="testpassword", email=self.email
        )
        # Profile is created by signal
        self.profile = self.user.profile
        self.profile.full_name = "Test User"
        self.profile.save()

        self.client = APIClient()
        self.url = reverse("user-profile")

    def test_get_profile_unauthenticated(self):
        response = self.client.get(self.url)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_get_profile_authenticated(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], self.email)
        self.assertEqual(response.data["full_name"], "Test User")

    def test_update_profile(self):
        self.client.force_authenticate(user=self.user)
        data = {"full_name": "Updated Name", "preferred_language": "NP"}
        response = self.client.patch(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.full_name, "Updated Name")
        self.assertEqual(self.user.profile.preferred_language, "NP")

    def test_update_read_only_fields(self):
        self.client.force_authenticate(user=self.user)
        # Attempt to update experience_points (read-only)
        data = {"experience_points": 9999}
        response = self.client.patch(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.profile.refresh_from_db()
        self.assertNotEqual(self.user.profile.experience_points, 9999)
