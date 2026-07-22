from community_library.models import LibraryCategory
from django.contrib import admin


@admin.register(LibraryCategory)
class LibraryCategoryAdmin(admin.ModelAdmin):
    list_display = ("slug", "label", "banner_path", "color")
    search_fields = ("slug", "label", "banner_path", "color")
    ordering = ("label",)
