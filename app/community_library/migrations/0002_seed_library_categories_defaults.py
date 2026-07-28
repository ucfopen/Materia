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
    "science": "/static/img/banners/banner_science.svg",
    "english": "/static/img/banners/banner_english.svg",
    "history": "/static/img/banners/banner_history.svg",
    "art": "/static/img/banners/banner_art.svg",
    "language": "/static/img/banners/banner_world_language.svg",
    "engineering": "/static/img/banners/banner_engineering.svg",
    "health": "/static/img/banners/banner_health.svg",
    "medicine": "/static/img/banners/banner_medicine.svg",
    "business": "/static/img/banners/banner_business.svg",
    "education": "/static/img/banners/banner_education.svg",
    "hospitality": "/static/img/banners/banner_hospitality.svg",
    "other": "/static/img/banners/banner_default.svg",
}

DEFAULT_LIBRARY_CATEGORY_COLORS = {
    "math": "#4ba829",
    "science": "#4ba829",
    "english": "#b944cc",
    "history": "#b944cc",
    "art": "#b944cc",
    "language": "#b944cc",
    "engineering": "#4ba829",
    "health": "#e17547",
    "medicine": "#e17547",
    "business": "#389ad6",
    "education": "#389ad6",
    "hospitality": "#389ad6",
    "other": "#389ad6",
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
                "color": DEFAULT_LIBRARY_CATEGORY_COLORS.get(
                    slug, "#959595"
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
