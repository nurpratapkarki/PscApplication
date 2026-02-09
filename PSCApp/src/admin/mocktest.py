from django.contrib import admin

from src.models.mocktest import MockTest, MockTestQuestion


class MockTestQuestionInline(admin.TabularInline):
    model = MockTestQuestion
    raw_id_fields = ("question",)
    extra = 1


@admin.register(MockTest)
class MockTestAdmin(admin.ModelAdmin):
    list_display = (
        "title_en",
        "test_type",
        "branch",
        "total_questions",
        "is_active",
        "is_public",
        "created_at",
    )
    list_filter = ("test_type", "is_active", "is_public", "branch")
    list_editable = ("is_active", "is_public")
    search_fields = ("title_en", "title_np")
    prepopulated_fields = {"slug": ("title_en",)}
    inlines = [MockTestQuestionInline]
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "created_at"
    list_per_page = 30

    fieldsets = (
        (
            "General Information",
            {
                "fields": (
                    "title_en",
                    "title_np",
                    "slug",
                    "test_type",
                    "description_en",
                    "description_np",
                ),
            },
        ),
        (
            "Configuration",
            {
                "fields": (
                    "branch",
                    "sub_branch",
                    "total_questions",
                    "duration_minutes",
                    "use_standard_duration",
                    "pass_percentage",
                ),
            },
        ),
        (
            "Status & Visibility",
            {
                "fields": ("is_active", "is_public"),
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
