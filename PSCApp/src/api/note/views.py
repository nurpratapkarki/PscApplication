from pathlib import Path
import logging

from django.core import signing
from django.db.models import Q
from django.http import FileResponse, Http404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from src.api.permissions import IsOwnerOrReadOnly
from src.api.note.serializers import NoteSerializer
from src.models.note import Note

NOTE_STREAM_MAX_AGE_SECONDS = 15 * 60
NOTE_STREAM_SIGNING_SALT = "note-stream-access"
logger = logging.getLogger(__name__)


class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.select_related("category", "created_by", "reviewed_by").all()
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["category", "status", "document_type"]
    search_fields = ["title_en", "title_np", "description_en", "description_np"]
    ordering_fields = ["created_at", "updated_at", "file_size"]

    def get_queryset(self):
        if self.request.user.is_staff:
            return self.queryset.order_by("-created_at")

        return self.queryset.filter(
            Q(status="APPROVED", is_public=True) | Q(created_by=self.request.user)
        ).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            status="PENDING_REVIEW",
            is_public=False,
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.warning("Note upload validation failed: %s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=["post"], url_path="request-access")
    def request_access(self, request, pk=None):
        note = self.get_object()
        if not note.is_public and note.created_by_id != request.user.id and not request.user.is_staff:
            return Response(
                {"detail": "You are not allowed to view this note."},
                status=status.HTTP_403_FORBIDDEN,
            )

        signer = signing.TimestampSigner(salt=NOTE_STREAM_SIGNING_SALT)
        token = signer.sign(f"{note.id}:{request.user.id}")
        stream_url = request.build_absolute_uri(f"/api/notes/{note.id}/stream/?token={token}")
        return Response(
            {
                "note_id": note.id,
                "viewer_url": stream_url,
                "expires_in_seconds": NOTE_STREAM_MAX_AGE_SECONDS,
            }
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="stream",
        permission_classes=[permissions.AllowAny],
        authentication_classes=[],
    )
    def stream(self, request, pk=None):
        token = request.query_params.get("token")
        if not token:
            return Response(
                {"detail": "Missing access token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        signer = signing.TimestampSigner(salt=NOTE_STREAM_SIGNING_SALT)
        try:
            unsigned = signer.unsign(token, max_age=NOTE_STREAM_MAX_AGE_SECONDS)
            note_id_text, _user_id_text = unsigned.split(":")
            note_id = int(note_id_text)
        except Exception:
            return Response(
                {"detail": "Invalid or expired token."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if str(note_id) != str(pk):
            return Response(
                {"detail": "Token does not match note."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            note = Note.objects.get(pk=pk)
        except Note.DoesNotExist as exc:
            raise Http404 from exc

        file_name = Path(note.document.name or "note").name
        response = FileResponse(
            note.document.open("rb"),
            content_type={
                "PDF": "application/pdf",
                "DOC": "application/msword",
                "DOCX": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            }.get(note.document_type, "application/octet-stream"),
        )
        response["Content-Disposition"] = f'inline; filename="{file_name}"'
        response["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response["Pragma"] = "no-cache"
        response["X-Content-Type-Options"] = "nosniff"
        response["X-Frame-Options"] = "SAMEORIGIN"
        return response

    @action(
        detail=True,
        methods=["post"],
        url_path="review",
        permission_classes=[permissions.IsAdminUser],
    )
    def review(self, request, pk=None):
        note = self.get_object()
        decision = str(request.data.get("decision", "")).strip().lower()
        review_notes = str(request.data.get("review_notes", "")).strip()

        if decision not in {"approve", "reject"}:
            return Response(
                {"detail": "decision must be either 'approve' or 'reject'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        note.reviewed_by = request.user
        note.review_notes = review_notes
        note.reviewed_at = timezone.now()

        if decision == "approve":
            note.status = "APPROVED"
            note.is_public = True
        else:
            note.status = "REJECTED"
            note.is_public = False

        note.save(
            update_fields=[
                "status",
                "is_public",
                "reviewed_by",
                "review_notes",
                "reviewed_at",
                "updated_at",
            ]
        )
        return Response(NoteSerializer(note).data)
