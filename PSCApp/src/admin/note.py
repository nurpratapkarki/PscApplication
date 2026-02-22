from django.contrib import admin

from src.models.note import Note


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title_en",
        "category",
        "document_type",
        "file_size",
        "status",
        "is_public",
        "created_by",
        "created_at",
    )
    list_filter = ("status", "document_type", "is_public", "category", "created_at")
    search_fields = ("title_en", "title_np", "description_en", "description_np")
    readonly_fields = (
        "document_type",
        "file_size",
        "created_at",
        "updated_at",
        "reviewed_at",
    )
    fieldsets = (
        (
            "Content",
            {
                "fields": (
                    "title_en",
                    "title_np",
                    "description_en",
                    "description_np",
                    "category",
                    "document",
                )
            },
        ),
        (
            "Moderation",
            {
                "fields": (
                    "status",
                    "is_public",
                    "created_by",
                    "reviewed_by",
                    "review_notes",
                    "reviewed_at",
                )
            },
        ),
        (
            "Metadata",
            {
                "fields": (
                    "document_type",
                    "file_size",
                    "created_at",
                    "updated_at",
                ),
                "classes": ("collapse",),
            },
        ),
    )

