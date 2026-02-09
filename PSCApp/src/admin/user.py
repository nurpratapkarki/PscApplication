from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group, User
from django.utils.html import format_html

from src.models.user import UserProfile

# Unregister and re-register with enhanced admin
admin.site.unregister(User)
admin.site.unregister(Group)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User Admin that inherits all functionality from Django's UserAdmin."""

    list_per_page = 50


@admin.register(Group)
class GroupAdmin(BaseGroupAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        "profile_picture_tag",
        "full_name",
        "email",
        "level",
        "experience_points",
        "target_branch",
        "is_active",
    )
    list_filter = ("is_active", "preferred_language", "target_branch", "level")
    search_fields = ("full_name", "email", "phone_number")
    ordering = ("-date_joined",)
    readonly_fields = (
        "profile_picture_tag",
        "level",
        "total_contributions",
        "total_questions_attempted",
        "date_joined",
        "last_login",
    )
    date_hierarchy = "date_joined"
    list_per_page = 25
    autocomplete_fields = ["target_branch", "target_sub_branch"]

    def profile_picture_tag(self, obj):
        if obj.profile_picture:
            return format_html(
                '<img src="{}" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover;" />',
                obj.profile_picture.url,
            )
        return "-"

    profile_picture_tag.short_description = "Avatar"

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "google_auth_user",
                    "profile_picture_tag",
                    "full_name",
                    "email",
                    "phone_number",
                    "profile_picture",
                ),
                "description": "Essential user identification and contact details.",
            },
        ),
        (
            "Academic Preferences",
            {
                "fields": ("preferred_language", "target_branch", "target_sub_branch"),
                "description": "User's study goals and language settings.",
            },
        ),
        (
            "Gamification & Progress",
            {
                "fields": (
                    "experience_points",
                    "level",
                    "total_contributions",
                    "total_questions_attempted",
                ),
                "classes": ("collapse",),
                "description": "User's achievement metrics and activity summary.",
            },
        ),
        (
            "Account Status",
            {
                "fields": ("is_active", "date_joined", "last_login"),
                "classes": ("collapse",),
            },
        ),
    )
