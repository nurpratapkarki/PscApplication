from django.contrib import admin
from django.utils.html import format_html

from src.models.question_answer import Answer, Question, QuestionReport


class AnswerInline(admin.TabularInline):
    model = Answer
    extra = 4
    max_num = 4


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = (
        "short_question",
        "category",
        "question_type",
        "difficulty_level",
        "status",
        "is_public",
        "times_attempted",
    )
    list_filter = (
        "status",
        "is_public",
        "question_type",
        "difficulty_level",
        "created_at",
        "category",
    )
    list_editable = ("status", "is_public", "difficulty_level")
    search_fields = ("question_text_en", "question_text_np")
    readonly_fields = (
        "created_at",
        "updated_at",
        "times_attempted",
        "times_correct",
        "reported_count",
    )
    inlines = [AnswerInline]
    fieldsets = (
        (
            "Question Content",
            {
                "fields": ("category", "question_text_en", "question_text_np"),
            },
        ),
        (
            "Classification & Settings",
            {
                "fields": (
                    "question_type",
                    "difficulty_level",
                    "status",
                    "is_public",
                ),
            },
        ),
        (
            "Engagement Analytics",
            {
                "fields": (
                    "times_attempted",
                    "times_correct",
                    "reported_count",
                ),
                "classes": ("collapse",),
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

    def short_question(self, obj):
        return obj.question_text_en[:50] + "..." if obj.question_text_en else "No Text"

    short_question.short_description = "Question"

    def status_colored(self, obj):
        colors = {
            "PUBLIC": "green",
            "DRAFT": "orange",
            "PENDING": "blue",
            "REJECTED": "red",
        }
        color = colors.get(obj.status, "grey")
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display(),
        )

    status_colored.short_description = "Status"

    @admin.action(description="Mark selected questions as Public")
    def make_public(self, request, queryset):
        updated = queryset.update(status="PUBLIC", is_public=True)
        self.message_user(request, f"{updated} questions marked as public.")

    @admin.action(description="Mark selected questions as Draft")
    def make_draft(self, request, queryset):
        updated = queryset.update(status="DRAFT", is_public=False)
        self.message_user(request, f"{updated} questions marked as draft.")


@admin.register(QuestionReport)
class QuestionReportAdmin(admin.ModelAdmin):
    list_display = (
        "question_link",
        "reason",
        "status_colored",
        "reported_by",
        "created_at",
    )
    list_filter = ("status", "reason", "created_at")
    readonly_fields = ("created_at", "resolved_at")
    actions = ["mark_resolved", "mark_rejected"]

    fieldsets = (
        (
            "Report Details",
            {
                "fields": ("question", "reason", "description", "reported_by"),
            },
        ),
        (
            "Resolution Info",
            {
                "fields": ("status", "reviewed_by", "resolved_at", "admin_notes"),
            },
        ),
        (
            "Timestamps",
            {
                "fields": ("created_at",),
                "classes": ("collapse",),
            },
        ),
    )

    def question_link(self, obj):
        return format_html(
            '<a href="/admin/src/question/{}/change/">Q{}</a>',
            obj.question.id,
            obj.question.id,
        )

    question_link.short_description = "Question"

    def status_colored(self, obj):
        colors = {
            "RESOLVED": "green",
            "PENDING": "orange",
            "REJECTED": "red",
        }
        color = colors.get(obj.status, "grey")
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display(),
        )

    status_colored.short_description = "Status"

    @admin.action(description="Mark report as Resolved")
    def mark_resolved(self, request, queryset):
        for report in queryset:
            report.resolve_report(request.user, "Resolved via Admin Action")
            report.notify_creator()
        self.message_user(request, f"{queryset.count()} reports resolved.")

    @admin.action(description="Mark report as Rejected")
    def mark_rejected(self, request, queryset):
        queryset.update(status="REJECTED")
        self.message_user(request, f"{queryset.count()} reports rejected.")
