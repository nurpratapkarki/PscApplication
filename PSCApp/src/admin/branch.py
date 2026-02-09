from django.contrib import admin

from src.models.branch import Branch, Category, SubBranch


class SubBranchInline(admin.TabularInline):
    model = SubBranch
    extra = 1
    prepopulated_fields = {"slug": ("name_en",)}


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = (
        "name_en",
        "name_np",
        "has_sub_branches",
        "is_active",
        "display_order",
    )
    list_editable = ("is_active", "display_order")
    search_fields = ("name_en", "name_np")
    inlines = [SubBranchInline]
    list_per_page = 30

    fieldsets = (
        (None, {"fields": ("name_en", "name_np", "slug")}),
        ("Display Settings", {"fields": ("is_active", "display_order")}),
    )


@admin.register(SubBranch)
class SubBranchAdmin(admin.ModelAdmin):
    list_display = ("name_en", "branch", "is_active", "display_order")
    list_filter = ("branch", "is_active")
    search_fields = ("name_en", "name_np")
    prepopulated_fields = {"slug": ("name_en",)}
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "branch",
                    "name_en",
                    "name_np",
                    "slug",
                    "description_en",
                    "description_np",
                ),
            },
        ),
        (
            "Display Settings",
            {
                "fields": ("icon", "display_order", "is_active"),
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


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = (
        "name_en",
        "scope_type",
        "target_branch",
        "category_type",
        "is_public",
        "is_active",
        "created_at",
    )
    list_filter = (
        "scope_type",
        "category_type",
        "is_public",
        "is_active",
        "target_branch",
    )
    list_editable = ("is_public", "is_active")
    search_fields = ("name_en", "name_np", "description_en")
    prepopulated_fields = {"slug": ("name_en",)}
    autocomplete_fields = ["target_branch", "target_sub_branch", "created_by"]
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "created_at"
    list_per_page = 30

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": ("name_en", "name_np", "slug", "description_en"),
            },
        ),
        (
            "Targeting & Scope",
            {
                "fields": (
                    "scope_type",
                    "target_branch",
                    "target_sub_branch",
                    "category_type",
                ),
            },
        ),
        (
            "Status & Settings",
            {
                "fields": ("is_public", "is_active", "created_by"),
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
