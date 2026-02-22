from pathlib import Path

from rest_framework import serializers

from src.models.note import MAX_NOTE_FILE_SIZE_BYTES, Note


class NoteSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(
        source="created_by.username",
        read_only=True,
    )
    category_name = serializers.CharField(
        source="category.name_en",
        read_only=True,
    )
    file_name = serializers.CharField(source="original_file_name", read_only=True)

    class Meta:
        model = Note
        fields = [
            "id",
            "title_en",
            "title_np",
            "description_en",
            "description_np",
            "category",
            "category_name",
            "document",
            "document_type",
            "file_name",
            "file_size",
            "status",
            "is_public",
            "created_by",
            "created_by_name",
            "review_notes",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "document_type",
            "file_name",
            "file_size",
            "status",
            "is_public",
            "created_by",
            "created_by_name",
            "review_notes",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "document": {"write_only": True},
            "title_en": {"required": False, "allow_blank": True},
            "title_np": {"required": False, "allow_blank": True},
            "description_en": {"required": False, "allow_blank": True},
            "description_np": {"required": False, "allow_blank": True},
        }

    def validate_document(self, value):
        file_name = value.name or ""
        extension = Path(file_name).suffix.lower()

        if extension not in {".pdf", ".doc", ".docx"}:
            raise serializers.ValidationError(
                "Unsupported file extension. Allowed: .pdf, .doc, .docx."
            )

        file_size = getattr(value, "size", None)
        if file_size and file_size > MAX_NOTE_FILE_SIZE_BYTES:
            raise serializers.ValidationError("File size must not exceed 10 MB.")

        return value

    def validate(self, attrs):
        title_en = attrs.get("title_en", "").strip()
        document = attrs.get("document")
        if not title_en and document:
            inferred_title = Path(document.name).stem.replace("_", " ").strip()
            attrs["title_en"] = inferred_title[:255]

        title_np = attrs.get("title_np", "").strip()
        if not title_np and attrs.get("title_en"):
            attrs["title_np"] = attrs["title_en"]

        return attrs
