from django.contrib import admin

from src.models.time_config import TimeConfiguration


@admin.register(TimeConfiguration)
class TimeConfigurationAdmin(admin.ModelAdmin):
    list_display = (
        "branch",
        "sub_branch",
        "category",
        "standard_duration_minutes",
        "questions_count",
        "is_active",
    )
    list_filter = ("branch", "is_active")
    search_fields = ("description", "branch__name_en")
    autocomplete_fields = ["branch", "sub_branch", "category"]

    fieldsets = (
        (
            "Targeting",
            {
                "fields": ("branch", "sub_branch", "category"),
            },
        ),
        (
            "Configuration",
            {
                "fields": (
                    "standard_duration_minutes",
                    "questions_count",
                ),
            },
        ),
        (
            "Status",
            {
                "fields": ("is_active", "description"),
            },
        ),
    )
