from uuid import uuid4

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from src.models.notification import Notification


class NotificationApiTests(APITestCase):
    def setUp(self):
        self.email = f"user_{uuid4().hex[:8]}@example.com"
        self.user = User.objects.create_user(
            username="user", password="password", email=self.email
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.notif1 = Notification.objects.create(
            user=self.user, notification_type="GENERAL", title_en="Alert 1"
        )
        self.notif2 = Notification.objects.create(
            user=self.user, notification_type="GENERAL", title_en="Alert 2"
        )

    def test_list_notifications(self):
        url = reverse("notification-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)

    def test_unread_count(self):
        url = reverse("notification-unread-count")
        response = self.client.get(url)
        self.assertEqual(response.data["unread_count"], 2)

    def test_mark_as_read(self):
        url = reverse("notification-mark-as-read", args=[self.notif1.id])
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notif1.refresh_from_db()
        self.assertTrue(self.notif1.is_read)

        # Check unread count
        url_unread = reverse("notification-unread-count")
        response = self.client.get(url_unread)
        self.assertEqual(response.data["unread_count"], 1)
