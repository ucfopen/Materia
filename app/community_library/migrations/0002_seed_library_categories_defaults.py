from django.db import migrations

DEFAULT_LIBRARY_CATEGORIES = [
    ("math", "Math"),
    ("science", "Science"),
    ("english", "English"),
    ("history", "History"),
    ("art", "Art"),
    ("language", "World Languages"),
    ("engineering", "Engineering"),
    ("health", "Health Sciences"),
    ("medicine", "Medicine"),
    ("business", "Business"),
    ("education", "Education"),
    ("hospitality", "Hospitality"),
    ("other", "Other"),
]


DEFAULT_LIBRARY_CATEGORY_BANNER_PATHS = {
    "math": "/static/img/banners/banner_math.svg",
    "science": "/static/img/banners/banner_math.svg",
    "english": "/static/img/banners/banner_math.svg",
    "history": "/static/img/banners/banner_math.svg",
    "art": "/static/img/banners/banner_math.svg",
    "language": "/static/img/banners/banner_math.svg",
    "engineering": "/static/img/banners/banner_math.svg",
    "health": "/static/img/banners/banner_math.svg",
    "medicine": "/static/img/banners/banner_math.svg",
    "business": "/static/img/banners/banner_math.svg",
    "education": "/static/img/banners/banner_math.svg",
    "hospitality": "/static/img/banners/banner_math.svg",
    "other": "/static/img/banners/banner_math.svg",
}


def seed_library_categories(apps, schema_editor):
    LibraryCategory = apps.get_model("community_library", "LibraryCategory")

    for slug, label in DEFAULT_LIBRARY_CATEGORIES:
        LibraryCategory.objects.get_or_create(
            slug=slug,
            defaults={
                "label": label,
                "banner_path": DEFAULT_LIBRARY_CATEGORY_BANNER_PATHS.get(
                    slug, "/static/img/banners/banner_math.svg"
                ),
            },
        )


class Migration(migrations.Migration):

    dependencies = [
        ("community_library", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_library_categories, migrations.RunPython.noop),
    ]
