from django.contrib import admin

from src.models.attempt_answer import UserAnswer, UserAttempt


class UserAnswerInline(admin.TabularInline):
    model = UserAnswer
    readonly_fields = (
        "question",
        "selected_answer",
        "is_correct",
        "time_taken_seconds",
    )
    can_delete = False
    extra = 0
    max_num = 0


@admin.register(UserAttempt)
class UserAttemptAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "description",
        "score_obtained",
        "percentage",
        "status",
        "created_at",
    )
    list_filter = ("status", "mode", "created_at")
    search_fields = ("user__email", "user__username")
    readonly_fields = (
        "start_time",
        "end_time",
        "total_time_taken",
        "score_obtained",
        "total_score",
        "percentage",
        "created_at",
        "updated_at",
    )
    inlines = [UserAnswerInline]
    date_hierarchy = "created_at"
    list_per_page = 30
    autocomplete_fields = ["user", "mock_test"]

    fieldsets = (
        (
            "Session Info",
            {
                "fields": ("user", "mock_test", "mode", "status"),
            },
        ),
        (
            "Results",
            {
                "fields": ("score_obtained", "total_score", "percentage"),
            },
        ),
        (
            "Timing",
            {
                "fields": ("start_time", "end_time", "total_time_taken"),
            },
        ),
        (
            "Metadata",
            {
                "fields": ("created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )

    def description(self, obj):
        if obj.mock_test:
            return obj.mock_test.title_en
        return "Practice Mode"
