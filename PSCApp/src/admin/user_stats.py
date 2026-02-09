from django.contrib import admin

from src.models.user_stats import StudyCollection, UserProgress, UserStatistics


@admin.register(UserStatistics)
class UserStatisticsAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "study_streak_days",
        "questions_answered",
        "correct_answers",
        "accuracy_rank",
    )
    search_fields = ("user__email",)
    readonly_fields = ("badges_earned", "last_updated")
    autocomplete_fields = ["user"]

    fieldsets = (
        (
            "User Information",
            {
                "fields": ("user",),
            },
        ),
        (
            "Study Metrics",
            {
                "fields": (
                    "questions_answered",
                    "correct_answers",
                    "mock_tests_completed",
                    "study_streak_days",
                    "longest_streak",
                    "last_activity_date",
                ),
            },
        ),
        (
            "Contribution Metrics",
            {
                "fields": ("questions_contributed", "questions_made_public"),
            },
        ),
        (
            "Rankings & Achievements",
            {
                "fields": ("contribution_rank", "accuracy_rank", "badges_earned"),
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


@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "category",
        "accuracy_percentage",
        "questions_attempted",
    )
    list_filter = ("category",)
    search_fields = ("user__email",)
    autocomplete_fields = ["user", "category"]

    fieldsets = (
        (
            "Progress Context",
            {
                "fields": ("user", "category"),
            },
        ),
        (
            "Calculated Stats",
            {
                "fields": (
                    "accuracy_percentage",
                    "questions_attempted",
                    "correct_answers",
                ),
            },
        ),
    )


@admin.register(StudyCollection)
class StudyCollectionAdmin(admin.ModelAdmin):
    list_display = ("name", "created_by", "is_private", "get_question_count")
    list_filter = ("is_private",)
    filter_horizontal = ("questions",)
    autocomplete_fields = ["created_by"]

    fieldsets = (
        (
            "Collection Info",
            {
                "fields": ("name", "description", "created_by", "is_private"),
            },
        ),
        (
            "Questions",
            {
                "fields": ("questions",),
            },
        ),
    )
