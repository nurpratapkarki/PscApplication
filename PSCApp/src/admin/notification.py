from django.contrib import admin

from src.models.notification import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "notification_type",
        "title_en",
        "is_read",
        "created_at",
    )
    list_filter = ("notification_type", "is_read", "created_at")
    list_editable = ("is_read",)
    search_fields = ("user__email", "title_en", "message_en")
    readonly_fields = ("created_at",)
    date_hierarchy = "created_at"
    list_per_page = 50
    autocomplete_fields = ["user", "related_question", "related_mock_test"]

    fieldsets = (
        (
            "User & Type",
            {
                "fields": ("user", "notification_type", "is_read"),
            },
        ),
        (
            "Content (EN)",
            {
                "fields": ("title_en", "message_en"),
            },
        ),
        (
            "Content (NP)",
            {
                "fields": ("title_np", "message_np"),
            },
        ),
        (
            "Context & Action",
            {
                "fields": ("related_question", "related_mock_test", "action_url"),
            },
        ),
        (
            "Metadata",
            {
                "fields": ("created_at",),
                "classes": ("collapse",),
            },
        ),
    )
