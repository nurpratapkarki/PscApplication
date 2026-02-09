from django.contrib import admin

from src.models.platform_stats import PlatformStats


@admin.register(PlatformStats)
class PlatformStatsAdmin(admin.ModelAdmin):
    list_display = (
        "last_updated",
        "total_users_active",
        "total_questions_public",
        "total_mock_tests_taken",
        "total_answers_submitted",
    )
    readonly_fields = (
        "total_questions_public",
        "total_questions_pending",
        "total_contributions_this_month",
        "total_users_active",
        "total_mock_tests_taken",
        "total_answers_submitted",
        "questions_added_today",
        "top_contributor_this_month",
        "most_attempted_category",
        "last_updated",
    )

    fieldsets = (
        (
            "Content Metrics",
            {
                "fields": (
                    "total_questions_public",
                    "total_questions_pending",
                    "questions_added_today",
                    "most_attempted_category",
                ),
            },
        ),
        (
            "User & Community",
            {
                "fields": (
                    "total_users_active",
                    "total_contributions_this_month",
                    "top_contributor_this_month",
                ),
            },
        ),
        (
            "Usage Statistics",
            {
                "fields": ("total_mock_tests_taken", "total_answers_submitted"),
            },
        ),
        (
            "Metadata",
            {
                "fields": ("last_updated",),
            },
        ),
    )

    def has_add_permission(self, request):
        return False
