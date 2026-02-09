from django.contrib import admin

from src.models.app_settings import AppSettings


@admin.register(AppSettings)
class AppSettingsAdmin(admin.ModelAdmin):
    list_display = ("setting_key", "is_active", "updated_at")
    list_filter = ("is_active",)
    search_fields = ("setting_key", "description")
    readonly_fields = ("updated_at",)

    fieldsets = (
        (
            "Config",
            {
                "fields": ("setting_key", "setting_value", "description"),
            },
        ),
        (
            "Status",
            {
                "fields": ("is_active", "updated_at"),
            },
        ),
    )
