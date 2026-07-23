import re

from core.models import WidgetInstance, WidgetQset
from django.contrib.auth.models import User
from django.db import models


class Tag(models.Model):
    name = models.CharField(max_length=50)
    normalized_name = models.CharField(max_length=50, unique=True)
    used_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    @staticmethod
    def normalize_name(tag_name: str) -> str:
        cleaned = " ".join((tag_name or "").strip().split()).lower()
        hyphenated = cleaned.replace(" ", "-")
        normalized = re.sub(r"[^a-z0-9-]", "", hyphenated)
        normalized = re.sub(r"-{2,}", "-", normalized).strip("-")
        return normalized

    def save(self, *args, **kwargs):
        cleaned = " ".join((self.name or "").strip().split())
        self.name = cleaned
        self.normalized_name = Tag.normalize_name(cleaned)
        super().save(*args, **kwargs)


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


class LibraryCategory(models.Model):
    slug = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=100)
    banner_path = models.CharField(max_length=255)
    color = models.CharField(max_length=20, default="#CCCCCC")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["label"], name="library_category_label_unique"
            ),
        ]
        ordering = ["label"]

    def __str__(self):
        return self.label


class LibraryEntry(models.Model):
    COURSE_LEVEL_CHOICES = [
        ("introductory", "Introductory"),
        ("intermediate", "Intermediate"),
        ("advanced", "Advanced"),
    ]

    tags = models.ManyToManyField(Tag, through="TagEntry")
    instance = models.OneToOneField(
        WidgetInstance,
        on_delete=models.CASCADE,
        related_name="published_entry",
    )
    category = models.ForeignKey(
        LibraryCategory,
        on_delete=models.PROTECT,
        related_name="entries",
    )
    course_level = models.CharField(
        max_length=50, choices=COURSE_LEVEL_CHOICES, blank=True, default=""
    )
    featured = models.BooleanField(default=False)
    is_banned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_available = models.BooleanField(default=True)

    @property
    def copy_count(self):
        if "annotated_copy_count" in self.__dict__:
            return self.__dict__["annotated_copy_count"]

        # Exclude the original published instance from copy totals.
        return self.copied_instances.exclude(pk=self.instance_id).count()

    @property
    def like_count(self):
        if "annotated_like_count" in self.__dict__:
            return self.__dict__["annotated_like_count"]

        return self.likes.count()

    @property
    def report_count(self):
        if "annotated_report_count" in self.__dict__:
            return self.__dict__["annotated_report_count"]

        return self.reports.count()

    def get_latest_snapshot_id(self):
        latest = self.snapshots.order_by("-created_at").first()
        if latest is not None:
            return latest.id
        return None

    class Meta:
        indexes = [
            models.Index(fields=["-created_at"], name="idx_entry_newest"),
        ]

    def __str__(self):
        return f"Library: {self.instance.name}"


class LibraryReport(models.Model):
    REASON_CHOICES = [
        ("inappropriate", "Inappropriate content"),
        ("incorrect", "Incorrect content"),
        ("spam", "Spam"),
        ("other", "Other"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="library_reports"
    )
    entry = models.ForeignKey(
        LibraryEntry, on_delete=models.CASCADE, related_name="reports"
    )
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    details = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "entry")


class LibrarySnapshot(models.Model):
    entry = models.ForeignKey(
        LibraryEntry,
        on_delete=models.CASCADE,
        related_name="snapshots",
    )
    name = models.CharField(max_length=100)
    qset = models.ForeignKey(WidgetQset, on_delete=models.PROTECT, related_name="snapshots")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(
                fields=["entry", "-created_at"], name="idx_snapshot_entry_latest"
            ),
        ]


class TagEntry(models.Model):
    tag = models.ForeignKey(
        Tag, on_delete=models.CASCADE, related_name="library_tagged"
    )
    entry = models.ForeignKey(
        LibraryEntry, on_delete=models.CASCADE, related_name="tagged"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["tag", "entry"], name="tag_entry_unique"),
        ]


class UserLike(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="library_likes"
    )
    entry = models.ForeignKey(
        LibraryEntry, on_delete=models.CASCADE, related_name="likes"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "entry")
