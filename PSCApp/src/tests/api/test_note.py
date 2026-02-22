from uuid import uuid4

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from src.models.branch import Category
from src.models.note import Note


class NoteAccessApiTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        suffix = uuid4().hex[:6]
        self.owner = User.objects.create_user(
            username=f"note_owner_{suffix}",
            password="password",
            email=f"note_owner_{suffix}@example.com",
        )
        self.viewer = User.objects.create_user(
            username=f"note_viewer_{suffix}",
            password="password",
            email=f"note_viewer_{suffix}@example.com",
        )
        self.category = Category.objects.create(
            name_en="Study Notes",
            name_np="Study Notes",
            scope_type="UNIVERSAL",
            slug=f"study-notes-{suffix}",
        )

    def _create_note(
        self,
        created_by: User,
        *,
        status_value: str,
        is_public: bool,
    ) -> Note:
        file_name = f"note-{uuid4().hex[:8]}.pdf"
        document = SimpleUploadedFile(
            file_name,
            b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF",
            content_type="application/pdf",
        )
        return Note.objects.create(
            title_en="Sample note",
            title_np="Sample note",
            description_en="",
            description_np="",
            category=self.category,
            document=document,
            status=status_value,
            is_public=is_public,
            created_by=created_by,
        )

    def test_non_owner_can_request_access_for_public_note(self):
        note = self._create_note(
            created_by=self.owner,
            status_value="APPROVED",
            is_public=True,
        )
        self.client.force_authenticate(user=self.viewer)

        url = reverse("note-request-access", args=[note.id])
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["note_id"], note.id)
        self.assertIn(f"/api/notes/{note.id}/stream/?token=", response.data["viewer_url"])

    def test_owner_can_request_access_for_own_pending_note(self):
        note = self._create_note(
            created_by=self.owner,
            status_value="PENDING_REVIEW",
            is_public=False,
        )
        self.client.force_authenticate(user=self.owner)

        url = reverse("note-request-access", args=[note.id])
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["note_id"], note.id)

    def test_non_owner_cannot_request_access_for_pending_note(self):
        note = self._create_note(
            created_by=self.owner,
            status_value="PENDING_REVIEW",
            is_public=False,
        )
        self.client.force_authenticate(user=self.viewer)

        url = reverse("note-request-access", args=[note.id])
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
