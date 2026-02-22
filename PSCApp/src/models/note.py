from pathlib import Path

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models

from src.models.branch import Category

MAX_NOTE_FILE_SIZE_BYTES = 10 * 1024 * 1024
ALLOWED_NOTE_EXTENSIONS = {".pdf", ".doc", ".docx"}


def validate_note_file(file_obj):
    file_size = getattr(file_obj, "size", None)
    if file_size and file_size > MAX_NOTE_FILE_SIZE_BYTES:
        raise ValidationError("File size must not exceed 10 MB.")

    file_name = getattr(file_obj, "name", "")
    extension = Path(file_name).suffix.lower()
    if extension not in ALLOWED_NOTE_EXTENSIONS:
        raise ValidationError("Only PDF, DOC, and DOCX files are allowed.")


class Note(models.Model):
    STATUS_CHOICES = [
        ("PENDING_REVIEW", "Pending Review"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    ]

    DOCUMENT_TYPE_CHOICES = [
        ("PDF", "PDF"),
        ("DOC", "DOC"),
        ("DOCX", "DOCX"),
    ]

    title_en = models.CharField(max_length=255)
    title_np = models.CharField(max_length=255, blank=True)
    description_en = models.TextField(blank=True)
    description_np = models.TextField(blank=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="notes",
    )
    document = models.FileField(
        upload_to="notes/",
        validators=[validate_note_file],
    )
    document_type = models.CharField(
        max_length=10,
        choices=DOCUMENT_TYPE_CHOICES,
    )
    file_size = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING_REVIEW",
    )
    is_public = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="contributed_notes",
    )
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_notes",
    )
    review_notes = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "notes"
        verbose_name = "Note"
        verbose_name_plural = "Notes"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "is_public"]),
            models.Index(fields=["category", "status"]),
            models.Index(fields=["created_by", "status"]),
        ]

    def __str__(self):
        return f"Note #{self.pk} - {self.title_en}"

    def save(self, *args, **kwargs):
        extension = Path(self.document.name or "").suffix.lower()
        self.file_size = getattr(self.document, "size", 0) or 0

        if extension == ".pdf":
            self.document_type = "PDF"
        elif extension == ".doc":
            self.document_type = "DOC"
        elif extension == ".docx":
            self.document_type = "DOCX"

        super().save(*args, **kwargs)

    @property
    def original_file_name(self):
        return Path(self.document.name).name

