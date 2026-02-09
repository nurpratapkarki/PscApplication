from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from src.models.app_settings import AppSettings
from src.models.branch import Branch
from src.models.time_config import TimeConfiguration


class ConfigApiTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        AppSettings.objects.create(setting_key="test_key", setting_value="test_val")
        branch = Branch.objects.create(name_en="B1", slug="b1")
        TimeConfiguration.objects.create(
            branch=branch, standard_duration_minutes=90, questions_count=100
        )

    def test_get_app_settings(self):
        url = reverse("appsettings-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = (
            response.data["results"] if "results" in response.data else response.data
        )
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["setting_key"], "test_key")

    def test_get_time_configs(self):
        url = reverse("timeconfiguration-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = (
            response.data["results"] if "results" in response.data else response.data
        )
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["standard_duration_minutes"], 90)
