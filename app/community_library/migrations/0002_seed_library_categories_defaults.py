from django.db import migrations

DEFAULT_LIBRARY_CATEGORIES = [
    ("arts-and-humanities", "Arts & Humanities"),
    ("business", "Business"),
    ("education", "Education"),
    ("engineering-and-computer-science", "Engineering & Computer Science"),
    ("health-medicine-and-nursing", "Health, Medicine & Nursing"),
    ("hospitality-and-tourism", "Hospitality & Tourism"),
    ("public-affairs-and-law", "Public Affairs & Law"),
    ("other", "Other"),
    ("sciences", "Sciences"),
    ("social-sciences", "Social Sciences"),
]


DEFAULT_LIBRARY_CATEGORY_BANNER_PATHS = {
    "arts-and-humanities": "/static/img/banners/banner_art.svg",
    "business": "/static/img/banners/banner_business.svg",
    "education": "/static/img/banners/banner_education.svg",
    "engineering-and-computer-science": "/static/img/banners/banner_engineering.svg",
    "health-medicine-and-nursing": "/static/img/banners/banner_health.svg",
    "hospitality-and-tourism": "/static/img/banners/banner_hospitality.svg",
    "public-affairs-and-law": "/static/img/banners/banner_history.svg",
    "other": "/static/img/banners/banner_default.svg",
    "sciences": "/static/img/banners/banner_science.svg",
    "social-sciences": "/static/img/banners/banner_english.svg",
}

DEFAULT_LIBRARY_CATEGORY_COLORS = {
    "arts-and-humanities": "#b944cc",
    "business": "#389ad6",
    "education": "#4ba829",
    "engineering-and-computer-science": "#e17547",
    "health-medicine-and-nursing": "#b944cc",
    "hospitality-and-tourism": "#389ad6",
    "public-affairs-and-law": "#4ba829",
    "other": "#e17547",
    "sciences": "#b944cc",
    "social-sciences": "#389ad6",
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
                "color": DEFAULT_LIBRARY_CATEGORY_COLORS.get(slug, "#959595"),
            },
        )


class Migration(migrations.Migration):

    dependencies = [
        ("community_library", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_library_categories, migrations.RunPython.noop),
    ]
