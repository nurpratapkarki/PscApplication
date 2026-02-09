from django.contrib import admin

from src.models.analytics import Contribution, DailyActivity, LeaderBoard


@admin.register(Contribution)
class ContributionAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "question",
        "contribution_year",
        "contribution_month",
        "status",
        "is_featured",
    )
    list_filter = ("status", "is_featured", "contribution_year", "contribution_month")
    search_fields = ("user__email", "user__username")
    readonly_fields = ("created_at",)
    actions = ["approve_contribution", "make_public", "reject_contribution"]

    fieldsets = (
        (
            "Core Details",
            {
                "fields": ("user", "question", "status"),
            },
        ),
        (
            "Period & Features",
            {
                "fields": ("contribution_year", "contribution_month", "is_featured"),
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

    @admin.action(description="Approve selected contributions")
    def approve_contribution(self, request, queryset):
        for contribution in queryset:
            contribution.approve_contribution()
        self.message_user(request, f"{queryset.count()} contributions approved.")

    @admin.action(description="Make selected contributions Public")
    def make_public(self, request, queryset):
        for contribution in queryset:
            contribution.make_public()
        self.message_user(request, f"{queryset.count()} contributions made public.")


@admin.register(LeaderBoard)
class LeaderBoardAdmin(admin.ModelAdmin):
    list_display = (
        "rank",
        "user",
        "total_score",
        "branch",
        "time_period",
    )
    list_filter = ("time_period", "branch")
    search_fields = ("user__email",)
    ordering = ("time_period", "branch", "rank")
    readonly_fields = ("last_updated",)
    autocomplete_fields = ["user", "branch", "sub_branch"]

    fieldsets = (
        (
            "Ranking Info",
            {
                "fields": ("rank", "previous_rank", "user"),
            },
        ),
        (
            "Context",
            {
                "fields": ("time_period", "branch", "sub_branch"),
            },
        ),
        (
            "Performance",
            {
                "fields": ("total_score", "tests_completed", "accuracy_percentage"),
            },
        ),
        (
            "Metadata",
            {
                "fields": ("last_updated",),
                "classes": ("collapse",),
            },
        ),
    )


@admin.register(DailyActivity)
class DailyActivityAdmin(admin.ModelAdmin):
    list_display = (
        "date",
        "new_users",
        "questions_added",
        "mock_tests_taken",
        "active_users",
    )
    ordering = ("-date",)
    readonly_fields = ("created_at",)

    fieldsets = (
        (
            "Date",
            {
                "fields": ("date",),
            },
        ),
        (
            "User Metrics",
            {
                "fields": ("new_users", "active_users"),
            },
        ),
        (
            "Content & Activity",
            {
                "fields": (
                    "questions_added",
                    "questions_approved",
                    "mock_tests_taken",
                    "total_answers_submitted",
                ),
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
