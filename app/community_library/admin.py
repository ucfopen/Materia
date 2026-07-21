from community_library.models import LibraryCategory
from django.contrib import admin


@admin.register(LibraryCategory)
class LibraryCategoryAdmin(admin.ModelAdmin):
    list_display = ("slug", "label", "banner_path")
    search_fields = ("slug", "label", "banner_path")
    ordering = ("label",)
