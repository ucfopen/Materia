from unittest.mock import patch

from community_library.models import (
    LibraryCategory,
    LibraryEntry,
    LibraryReport,
    LibrarySnapshot,
    Tag,
    TagEntry,
    UserLike,
)
from core.models import (
    Notification,
    ObjectPermission,
    Widget,
    WidgetInstance,
    WidgetQset,
)
from django.contrib.auth.models import Group, User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient


class CommunityLibraryViewSetTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.categories = {
            slug: LibraryCategory.objects.get_or_create(
                slug=slug,
                defaults={
                    "label": label,
                    "banner_path": "/static/img/banners/banner_math.svg",
                },
            )[0]
            for slug, label in [
                ("math", "Math"),
                ("science", "Science"),
                ("history", "History"),
                ("other", "Other"),
            ]
        }

        cls.author_group, _ = Group.objects.get_or_create(name="basic_author")
        cls.support_group, _ = Group.objects.get_or_create(name="support_user")

        cls.author_user = User.objects.create_user(
            username="author",
            first_name="Jane",
            last_name="Doe",
            email="author@example.com",
            password="testpass123",
        )
        cls.author_user.groups.add(cls.author_group)

        cls.another_author = User.objects.create_user(
            username="another_author",
            first_name="John",
            last_name="Smith",
            email="another_author@example.com",
            password="testpass123",
        )
        cls.another_author.groups.add(cls.author_group)

        cls.regular_user = User.objects.create_user(
            username="regular",
            email="regular@example.com",
            password="testpass123",
        )

        cls.support_user = User.objects.create_user(
            username="support",
            email="support@example.com",
            password="testpass123",
        )
        cls.support_user.groups.add(cls.support_group)

        cls.superuser = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="testpass123",
        )

        cls.widget = Widget.objects.create(
            name="Test Widget",
            clean_name="test-widget",
            creator="test_widget_creator.html",
            is_editable=True,
            is_playable=True,
            is_scorable=True,
        )

        cls.another_widget = Widget.objects.create(
            name="Another Widget",
            clean_name="another-widget",
            creator="test_widget_creator.html",
            is_editable=True,
            is_playable=True,
        )

        cls.shared_instance = WidgetInstance.objects.create(
            id="shared001",
            widget=cls.widget,
            user=cls.author_user,
            name="Shared Instance",
            is_draft=False,
        )
        ObjectPermission.objects.create(
            user=cls.author_user,
            content_object=cls.shared_instance,
            permission=ObjectPermission.PERMISSION_FULL,
        )
        WidgetQset.objects.create(
            instance=cls.shared_instance,
            data="eyJ0ZXN0IjogImRhdGEifQ==",
            version="1",
        )
        cls.shared_qset = cls.shared_instance.get_latest_qset()

        cls.library_entry = LibraryEntry.objects.create(
            instance=cls.shared_instance,
            category=cls.categories["math"],
            course_level="introductory",
        )
        cls.shared_instance.library_entry = cls.library_entry
        cls.shared_instance.save(update_fields=["library_entry"])
        cls.library_snapshot = LibrarySnapshot.objects.create(
            entry=cls.library_entry,
            name="Shared Instance",
            qset=cls.shared_qset,
        )

        cls.shared_instance_2 = WidgetInstance.objects.create(
            id="shared002",
            widget=cls.another_widget,
            user=cls.another_author,
            name="Alpha Instance",
            is_draft=False,
        )
        ObjectPermission.objects.create(
            user=cls.another_author,
            content_object=cls.shared_instance_2,
            permission=ObjectPermission.PERMISSION_FULL,
        )
        WidgetQset.objects.create(
            instance=cls.shared_instance_2,
            data="eyJ0ZXN0IjogImRhdGEifQ==",
            version="1",
        )
        cls.shared_qset_2 = cls.shared_instance_2.get_latest_qset()

        cls.library_entry_2 = LibraryEntry.objects.create(
            instance=cls.shared_instance_2,
            category=cls.categories["science"],
            course_level="advanced",
        )
        cls.shared_instance_2.library_entry = cls.library_entry_2
        cls.shared_instance_2.save(update_fields=["library_entry"])
        cls.library_snapshot_2 = LibrarySnapshot.objects.create(
            entry=cls.library_entry_2,
            name="Alpha Instance",
            qset=cls.shared_qset_2,
        )

        for idx in range(3):
            WidgetInstance.objects.create(
                id=f"cp2{idx:04d}",
                widget=cls.another_widget,
                user=cls.another_author,
                name=f"Copy {idx}",
                is_draft=False,
                library_entry=cls.library_entry_2,
                library_snapshot=cls.library_snapshot_2,
            )

        for idx in range(5):
            like_user = User.objects.create_user(
                username=f"like_user_{idx}",
                email=f"like_user_{idx}@example.com",
                password="testpass123",
            )
            UserLike.objects.create(user=like_user, entry=cls.library_entry_2)

        cls.unshared_instance = WidgetInstance.objects.create(
            id="unshare1",
            widget=cls.widget,
            user=cls.author_user,
            name="Unshared Instance",
            is_draft=False,
        )
        ObjectPermission.objects.create(
            user=cls.author_user,
            content_object=cls.unshared_instance,
            permission=ObjectPermission.PERMISSION_FULL,
        )
        WidgetQset.objects.create(
            instance=cls.unshared_instance,
            data="eyJ0ZXN0IjogImRhdGEifQ==",
            version="1",
        )

    def setUp(self):
        self.client = APIClient()


class TestCommunityLibraryList(CommunityLibraryViewSetTestCase):
    """Tests for GET /api/community-library/"""

    def test_unauthenticated_returns_200(self):
        response = self.client.get("/api/community-library/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_authenticated_returns_published_entries(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/community-library/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        instance_ids = [r["instance_id"] for r in response.data["results"]]
        self.assertIn(self.shared_instance.id, instance_ids)
        self.assertIn(self.shared_instance_2.id, instance_ids)

    def test_excludes_unshared_instance(self):
        """Entries with no instance.library_entry pointer should not appear."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/community-library/")
        instance_ids = [r["instance_id"] for r in response.data["results"]]
        self.assertNotIn(self.unshared_instance.id, instance_ids)

    def test_excludes_banned_entries(self):
        self.library_entry.is_banned = True
        self.library_entry.save(update_fields=["is_banned"])
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/community-library/")
        instance_ids = [r["instance_id"] for r in response.data["results"]]
        self.assertNotIn(self.shared_instance.id, instance_ids)

        self.library_entry.is_banned = False
        self.library_entry.save(update_fields=["is_banned"])

    def test_excludes_deleted_instance(self):
        """If the instance is soft-deleted, entry should not appear."""
        self.shared_instance.is_deleted = True
        self.shared_instance.save(update_fields=["is_deleted"])
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/community-library/")
        instance_ids = [r["instance_id"] for r in response.data["results"]]
        self.assertNotIn(self.shared_instance.id, instance_ids)

        self.shared_instance.is_deleted = False
        self.shared_instance.save(update_fields=["is_deleted"])

    def test_search_by_name(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/community-library/", {"search": "Shared"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        instance_ids = [r["instance_id"] for r in response.data["results"]]
        self.assertIn(self.shared_instance.id, instance_ids)
        self.assertNotIn(self.shared_instance_2.id, instance_ids)

    def test_filter_by_widget_id(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(
            "/api/community-library/", {"widget_id": self.another_widget.id}
        )
        instance_ids = [r["instance_id"] for r in response.data["results"]]
        self.assertIn(self.shared_instance_2.id, instance_ids)
        self.assertNotIn(self.shared_instance.id, instance_ids)

    def test_filter_by_category(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/community-library/", {"category": "math"})
        instance_ids = [r["instance_id"] for r in response.data["results"]]
        self.assertIn(self.shared_instance.id, instance_ids)
        self.assertNotIn(self.shared_instance_2.id, instance_ids)

    def test_filter_by_course_level(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(
            "/api/community-library/", {"course_level": "advanced"}
        )
        instance_ids = [r["instance_id"] for r in response.data["results"]]
        self.assertIn(self.shared_instance_2.id, instance_ids)
        self.assertNotIn(self.shared_instance.id, instance_ids)

    def test_filter_featured(self):
        self.library_entry.featured = True
        self.library_entry.save(update_fields=["featured"])
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/community-library/", {"featured": "true"})
        instance_ids = [r["instance_id"] for r in response.data["results"]]
        self.assertIn(self.shared_instance.id, instance_ids)
        self.assertNotIn(self.shared_instance_2.id, instance_ids)

        self.library_entry.featured = False
        self.library_entry.save(update_fields=["featured"])

    def test_sort_alphabetical(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/community-library/", {"sort": "alphabetical"})
        names = [r["instance_name"] for r in response.data["results"]]
        self.assertEqual(names, sorted(names))

    def test_sort_most_copied(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/community-library/", {"sort": "most_copied"})
        results = response.data["results"]
        self.assertEqual(results[0]["instance_id"], self.shared_instance_2.id)

    def test_sort_most_liked(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/community-library/", {"sort": "most_liked"})
        results = response.data["results"]
        self.assertEqual(results[0]["instance_id"], self.shared_instance_2.id)

    def test_response_includes_expected_fields(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/community-library/")
        entry = next(
            r
            for r in response.data["results"]
            if r["instance_id"] == self.shared_instance.id
        )
        expected_fields = [
            "id",
            "instance_id",
            "instance_name",
            "widget",
            "owner_display_name",
            "category",
            "category_display",
            "course_level",
            "course_level_display",
            "featured",
            "copy_count",
            "like_count",
            "latest_snapshot_id",
            "user_has_liked",
            "created_at",
        ]
        for field in expected_fields:
            self.assertIn(field, entry)

    def test_owner_display_name_format(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/community-library/")
        entry = next(
            r
            for r in response.data["results"]
            if r["instance_id"] == self.shared_instance.id
        )
        self.assertEqual(entry["owner_display_name"], "Jane Doe")

    def test_user_has_liked_false_by_default(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/community-library/")
        entry = next(
            r
            for r in response.data["results"]
            if r["instance_id"] == self.shared_instance.id
        )
        self.assertFalse(entry["user_has_liked"])

    def test_user_has_liked_true_when_liked(self):
        UserLike.objects.create(user=self.regular_user, entry=self.library_entry)
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/community-library/")
        entry = next(
            r
            for r in response.data["results"]
            if r["instance_id"] == self.shared_instance.id
        )
        self.assertTrue(entry["user_has_liked"])

        UserLike.objects.filter(
            user=self.regular_user, entry=self.library_entry
        ).delete()

    def test_instance_name_uses_snapshot_name(self):
        """Library list should show the snapshot name, not the current instance name."""
        self.shared_instance.name = "Renamed Instance"
        self.shared_instance.save(update_fields=["name"])
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/community-library/")
        entry = next(
            r
            for r in response.data["results"]
            if r["instance_id"] == self.shared_instance.id
        )
        self.assertEqual(entry["instance_name"], "Shared Instance")

        self.shared_instance.name = "Shared Instance"
        self.shared_instance.save(update_fields=["name"])

    def test_latest_snapshot_id_is_returned(self):
        """List should return the latest snapshot ID for each entry."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/community-library/")
        entry = next(
            r
            for r in response.data["results"]
            if r["instance_id"] == self.shared_instance.id
        )
        snapshot = self.library_entry.snapshots.order_by("-created_at").first()
        self.assertEqual(entry["latest_snapshot_id"], snapshot.id)

    def test_snapshotless_entry_serializes_with_fallback_values(self):
        self.library_entry.snapshots.all().delete()
        self.shared_instance.name = "Current Shared Name"
        self.shared_instance.save(update_fields=["name"])

        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/community-library/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        entry = next(
            r
            for r in response.data["results"]
            if r["instance_id"] == self.shared_instance.id
        )
        self.assertEqual(entry["instance_name"], "Current Shared Name")
        self.assertIsNone(entry["latest_snapshot_id"])

    def test_moderation_list_requires_elevated_user(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/community-library/", {"moderation": "true"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_moderation_list_includes_moderation_fields_for_elevated_user(self):
        LibraryReport.objects.create(
            user=self.regular_user,
            entry=self.library_entry,
            reason="spam",
        )
        self.client.force_authenticate(user=self.support_user)
        response = self.client.get("/api/community-library/", {"moderation": "true"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        entry = next(
            r
            for r in response.data["results"]
            if r["instance_id"] == self.shared_instance.id
        )
        self.assertIn("report_count", entry)
        self.assertIn("last_reported_at", entry)

    def test_moderation_status_filter_banned(self):
        self.library_entry.is_banned = True
        self.library_entry.save(update_fields=["is_banned"])

        self.client.force_authenticate(user=self.support_user)
        response = self.client.get(
            "/api/community-library/",
            {"moderation": "true", "status": "banned"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        instance_ids = [r["instance_id"] for r in response.data["results"]]
        self.assertIn(self.shared_instance.id, instance_ids)
        self.assertNotIn(self.shared_instance_2.id, instance_ids)

    def test_moderation_status_filter_reported(self):
        LibraryReport.objects.create(
            user=self.regular_user,
            entry=self.library_entry,
            reason="spam",
        )
        self.client.force_authenticate(user=self.support_user)
        response = self.client.get(
            "/api/community-library/",
            {"moderation": "true", "status": "reported"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        instance_ids = [r["instance_id"] for r in response.data["results"]]
        self.assertIn(self.shared_instance.id, instance_ids)
        self.assertNotIn(self.shared_instance_2.id, instance_ids)

    def test_moderation_status_filter_unpublished(self):
        self.library_entry_2.is_available = False
        self.library_entry_2.save(update_fields=["is_available"])

        self.client.force_authenticate(user=self.support_user)
        response = self.client.get(
            "/api/community-library/",
            {"moderation": "true", "status": "unpublished"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        instance_ids = [r["instance_id"] for r in response.data["results"]]
        self.assertIn(self.shared_instance_2.id, instance_ids)
        self.assertNotIn(self.shared_instance.id, instance_ids)

        self.library_entry_2.is_available = True
        self.library_entry_2.save(update_fields=["is_available"])

    def test_moderation_status_filter_featured(self):
        self.library_entry.featured = True
        self.library_entry.save(update_fields=["featured"])

        self.client.force_authenticate(user=self.support_user)
        response = self.client.get(
            "/api/community-library/",
            {"moderation": "true", "status": "featured"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        instance_ids = [r["instance_id"] for r in response.data["results"]]
        self.assertIn(self.shared_instance.id, instance_ids)
        self.assertNotIn(self.shared_instance_2.id, instance_ids)

        self.library_entry.featured = False
        self.library_entry.save(update_fields=["featured"])

    def test_moderation_list_default_includes_report_counts(self):
        extra_reporter = User.objects.create_user(
            username="mod_reporter",
            email="mod_reporter@example.com",
            password="testpass123",
        )
        LibraryReport.objects.create(
            user=self.regular_user,
            entry=self.library_entry,
            reason="spam",
        )
        LibraryReport.objects.create(
            user=extra_reporter,
            entry=self.library_entry,
            reason="inappropriate",
        )
        LibraryReport.objects.create(
            user=self.another_author,
            entry=self.library_entry_2,
            reason="spam",
        )

        self.client.force_authenticate(user=self.support_user)
        response = self.client.get("/api/community-library/", {"moderation": "true"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result_ids = [r["instance_id"] for r in response.data["results"]]
        self.assertIn(self.shared_instance.id, result_ids)
        self.assertIn(self.shared_instance_2.id, result_ids)
        for entry in response.data["results"]:
            self.assertIn("report_count", entry)

    def test_moderation_deleted_false_excludes_deleted_instances(self):
        self.shared_instance_2.is_deleted = True
        self.shared_instance_2.save(update_fields=["is_deleted"])

        self.client.force_authenticate(user=self.support_user)
        response = self.client.get(
            "/api/community-library/",
            {"moderation": "true", "deleted": "false"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        instance_ids = [r["instance_id"] for r in response.data["results"]]
        self.assertNotIn(self.shared_instance_2.id, instance_ids)

        self.shared_instance_2.is_deleted = False
        self.shared_instance_2.save(update_fields=["is_deleted"])


class TestCommunityLibraryDetail(CommunityLibraryViewSetTestCase):
    """Tests for GET /api/community-library/{id}/"""

    def test_detail_returns_200_for_visible_entry(self):
        response = self.client.get(f"/api/community-library/{self.library_entry.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.library_entry.id)

    def test_detail_banned_entry_returns_403_for_regular_user(self):
        self.library_entry.is_banned = True
        self.library_entry.save(update_fields=["is_banned"])

        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(f"/api/community-library/{self.library_entry.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.library_entry.is_banned = False
        self.library_entry.save(update_fields=["is_banned"])

    def test_detail_banned_entry_returns_200_for_elevated_user(self):
        self.library_entry.is_banned = True
        self.library_entry.save(update_fields=["is_banned"])

        self.client.force_authenticate(user=self.support_user)
        response = self.client.get(f"/api/community-library/{self.library_entry.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.library_entry.id)

        self.library_entry.is_banned = False
        self.library_entry.save(update_fields=["is_banned"])

    def test_detail_returns_404_for_missing_entry(self):
        response = self.client.get("/api/community-library/999999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class TestCommunityLibraryCopy(CommunityLibraryViewSetTestCase):
    """Tests for POST /api/community-library/{id}/copy/"""

    def test_unauthenticated_returns_403(self):
        response = self.client.post(
            f"/api/community-library/{self.library_entry.id}/copy/"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_user_can_copy(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            f"/api/community-library/{self.library_entry.id}/copy/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Shared Instance")
        self.assertNotEqual(response.data["id"], self.shared_instance.id)

    def test_copy_creates_instance_with_correct_owner(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            f"/api/community-library/{self.library_entry.id}/copy/"
        )
        new_instance = WidgetInstance.objects.get(pk=response.data["id"])
        self.assertEqual(new_instance.user, self.regular_user)

    def test_copied_instance_tracks_source_entry(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            f"/api/community-library/{self.library_entry.id}/copy/"
        )
        new_instance = WidgetInstance.objects.get(pk=response.data["id"])
        self.assertEqual(new_instance.library_entry_id, self.library_entry.id)
        self.assertEqual(new_instance.library_snapshot_id, self.library_snapshot.id)

    def test_copy_without_snapshot_returns_400(self):
        self.library_entry.snapshots.all().delete()

        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            f"/api/community-library/{self.library_entry.id}/copy/"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["error"],
            "This library entry has no snapshots to copy from.",
        )

    def test_copy_increments_copy_count(self):
        original_count = self.library_entry.copy_count
        self.client.force_authenticate(user=self.regular_user)
        self.client.post(f"/api/community-library/{self.library_entry.id}/copy/")
        self.library_entry.refresh_from_db()
        self.assertEqual(self.library_entry.copy_count, original_count + 1)

    def test_copy_uses_snapshot_data(self):
        """Copy should create from snapshot data, with correct widget type."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            f"/api/community-library/{self.library_entry.id}/copy/"
        )
        new_instance = WidgetInstance.objects.get(pk=response.data["id"])
        self.assertEqual(new_instance.widget_id, self.shared_instance.widget_id)
        self.assertEqual(new_instance.name, "Shared Instance")

    def test_copy_has_qset(self):
        """Copied instance should have a qset from the snapshot data."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            f"/api/community-library/{self.library_entry.id}/copy/"
        )
        new_instance = WidgetInstance.objects.get(pk=response.data["id"])
        qset = new_instance.get_latest_qset()
        self.assertIsNotNone(qset)


class TestCommunityLibraryLike(CommunityLibraryViewSetTestCase):
    """Tests for POST /api/community-library/{id}/like/"""

    def test_unauthenticated_returns_403(self):
        response = self.client.post(
            f"/api/community-library/{self.library_entry.id}/like/"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_first_like_creates_like(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            f"/api/community-library/{self.library_entry.id}/like/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["liked"])
        self.assertTrue(
            UserLike.objects.filter(
                user=self.regular_user, entry=self.library_entry
            ).exists()
        )

    def test_first_like_increments_like_count(self):
        original_count = self.library_entry.like_count
        self.client.force_authenticate(user=self.regular_user)
        self.client.post(f"/api/community-library/{self.library_entry.id}/like/")
        self.library_entry.refresh_from_db()
        self.assertEqual(self.library_entry.like_count, original_count + 1)

    def test_second_like_unlikes(self):
        UserLike.objects.create(user=self.regular_user, entry=self.library_entry)
        original_count = self.library_entry.like_count
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            f"/api/community-library/{self.library_entry.id}/like/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["liked"])
        self.assertFalse(
            UserLike.objects.filter(
                user=self.regular_user, entry=self.library_entry
            ).exists()
        )
        self.library_entry.refresh_from_db()
        self.assertEqual(self.library_entry.like_count, original_count - 1)

    def test_like_count_in_response(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            f"/api/community-library/{self.library_entry.id}/like/"
        )
        self.assertIn("like_count", response.data)


class TestCommunityLibraryReport(CommunityLibraryViewSetTestCase):
    """Tests for GET/POST /api/community-library/{id}/reports/"""

    def test_reports_get_unauthenticated_returns_403(self):
        response = self.client.get(
            f"/api/community-library/{self.library_entry.id}/reports/"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_reports_get_regular_user_returns_403(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(
            f"/api/community-library/{self.library_entry.id}/reports/"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_reports_get_support_user_returns_reports(self):
        LibraryReport.objects.create(
            user=self.regular_user,
            entry=self.library_entry,
            reason="spam",
            details="reported",
        )

        self.client.force_authenticate(user=self.support_user)
        response = self.client.get(
            f"/api/community-library/{self.library_entry.id}/reports/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["reason"], "spam")

    def test_reports_get_superuser_returns_reports(self):
        LibraryReport.objects.create(
            user=self.regular_user,
            entry=self.library_entry,
            reason="inappropriate",
            details="bad content",
        )

        self.client.force_authenticate(user=self.superuser)
        response = self.client.get(
            f"/api/community-library/{self.library_entry.id}/reports/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["reason"], "inappropriate")

    def test_reports_get_returns_404_for_missing_entry(self):
        self.client.force_authenticate(user=self.support_user)
        response = self.client.get("/api/community-library/999999/reports/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_returns_403(self):
        response = self.client.post(
            f"/api/community-library/{self.library_entry.id}/reports/",
            {"reason": "spam"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_valid_report_creates_report(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            f"/api/community-library/{self.library_entry.id}/reports/",
            {"reason": "spam", "details": "This is spam"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertTrue(
            LibraryReport.objects.filter(
                user=self.regular_user, entry=self.library_entry
            ).exists()
        )

    def test_duplicate_report_returns_400(self):
        LibraryReport.objects.create(
            user=self.regular_user,
            entry=self.library_entry,
            reason="spam",
        )
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            f"/api/community-library/{self.library_entry.id}/reports/",
            {"reason": "inappropriate"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_report_increments_report_count(self):
        original_count = self.library_entry.report_count
        self.client.force_authenticate(user=self.regular_user)
        self.client.post(
            f"/api/community-library/{self.library_entry.id}/reports/",
            {"reason": "spam"},
            format="json",
        )
        self.library_entry.refresh_from_db()
        self.assertEqual(self.library_entry.report_count, original_count + 1)

    @patch("api.views.community_library.REPORT_THRESHOLD", 1)
    @patch("core.models.Notification.send_email")
    def test_report_at_threshold_auto_bans(self, mock_send_email):
        self.client.force_authenticate(user=self.regular_user)
        self.client.post(
            f"/api/community-library/{self.library_entry.id}/reports/",
            {"reason": "spam"},
            format="json",
        )
        self.library_entry.refresh_from_db()
        self.assertTrue(self.library_entry.is_banned)

        self.library_entry.is_banned = False
        self.library_entry.save(update_fields=["is_banned"])

    @patch("api.views.community_library.REPORT_THRESHOLD", 1)
    @patch("core.models.Notification.send_email")
    def test_report_at_threshold_creates_admin_notifications(self, mock_send_email):
        self.client.force_authenticate(user=self.regular_user)
        self.client.post(
            f"/api/community-library/{self.library_entry.id}/reports/",
            {"reason": "spam"},
            format="json",
        )
        admin_notifications = Notification.objects.filter(
            action="library_report",
            item_id=self.shared_instance.id,
        )
        admin_user_ids = set(admin_notifications.values_list("to_id", flat=True))
        self.assertIn(self.superuser.id, admin_user_ids)
        self.assertIn(self.support_user.id, admin_user_ids)

        admin_notifications.delete()
        self.library_entry.is_banned = False
        self.library_entry.save(update_fields=["is_banned"])

    def test_missing_reason_returns_400(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            f"/api/community-library/{self.library_entry.id}/reports/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_reason_returns_400(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            f"/api/community-library/{self.library_entry.id}/reports/",
            {"reason": "not_a_valid_reason"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TestCommunityLibraryModerate(CommunityLibraryViewSetTestCase):
    """Tests for PATCH /api/community-library/{id}/moderate/"""

    def test_unauthenticated_returns_403(self):
        response = self.client.patch(
            f"/api/community-library/{self.library_entry.id}/moderate/",
            {"featured": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_regular_user_returns_403(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.patch(
            f"/api/community-library/{self.library_entry.id}/moderate/",
            {"featured": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_superuser_can_toggle_featured(self):
        self.client.force_authenticate(user=self.superuser)
        response = self.client.patch(
            f"/api/community-library/{self.library_entry.id}/moderate/",
            {"featured": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.library_entry.refresh_from_db()
        self.assertTrue(self.library_entry.featured)

        self.library_entry.featured = False
        self.library_entry.save(update_fields=["featured"])

    def test_support_user_can_toggle_is_banned(self):
        self.client.force_authenticate(user=self.support_user)
        response = self.client.patch(
            f"/api/community-library/{self.library_entry.id}/moderate/",
            {"is_banned": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.library_entry.refresh_from_db()
        self.assertTrue(self.library_entry.is_banned)

        self.library_entry.is_banned = False
        self.library_entry.save(update_fields=["is_banned"])

    def test_unrecognized_fields_are_ignored(self):
        self.client.force_authenticate(user=self.superuser)
        response = self.client.patch(
            f"/api/community-library/{self.library_entry.id}/moderate/",
            {"copy_count": 9999, "featured": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.library_entry.refresh_from_db()
        self.assertNotEqual(self.library_entry.copy_count, 9999)
        self.assertTrue(self.library_entry.featured)

        self.library_entry.featured = False
        self.library_entry.save(update_fields=["featured"])


class TestPublishToLibrary(CommunityLibraryViewSetTestCase):
    """Tests for PUT /api/instances/{id}/publish_to_library/"""

    def test_unauthenticated_returns_403(self):
        response = self.client.put(
            f"/api/instances/{self.unshared_instance.id}/publish_to_library/",
            {"category": "math"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_publish(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.put(
            f"/api/instances/{self.unshared_instance.id}/publish_to_library/",
            {"category": "science", "course_level": "intermediate"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.unshared_instance.refresh_from_db()
        entry = LibraryEntry.objects.get(instance=self.unshared_instance)
        self.assertEqual(self.unshared_instance.library_entry_id, entry.id)
        self.assertEqual(entry.category.slug, "science")
        self.assertEqual(entry.course_level, "intermediate")

        entry.delete()
        self.unshared_instance.library_entry = None
        self.unshared_instance.save(update_fields=["library_entry"])

    def test_publish_creates_snapshot(self):
        """Publishing should create a LibrarySnapshot record."""
        self.client.force_authenticate(user=self.author_user)
        self.client.put(
            f"/api/instances/{self.unshared_instance.id}/publish_to_library/",
            {"category": "math"},
            format="json",
        )
        entry = LibraryEntry.objects.get(instance=self.unshared_instance)
        snapshot = entry.snapshots.first()
        self.assertIsNotNone(snapshot)
        self.assertEqual(snapshot.name, self.unshared_instance.name)

        entry.delete()
        self.unshared_instance.library_entry = None
        self.unshared_instance.save(update_fields=["library_entry"])

    def test_snapshot_has_correct_qset(self):
        """Snapshot should have a copy of the instance's qset data."""
        self.client.force_authenticate(user=self.author_user)
        self.client.put(
            f"/api/instances/{self.unshared_instance.id}/publish_to_library/",
            {"category": "math"},
            format="json",
        )
        entry = LibraryEntry.objects.get(instance=self.unshared_instance)
        snapshot = entry.snapshots.first()
        source_qset = self.unshared_instance.get_latest_qset()
        self.assertIsNotNone(snapshot)
        self.assertEqual(snapshot.qset_id, source_qset.id)
        self.assertEqual(snapshot.qset.data, source_qset.data)
        self.assertEqual(snapshot.qset.version, source_qset.version)

        entry.delete()
        self.unshared_instance.library_entry = None
        self.unshared_instance.save(update_fields=["library_entry"])

    def test_entry_instance_points_to_original(self):
        """Entry's instance should point to the original widget."""
        self.client.force_authenticate(user=self.author_user)
        self.client.put(
            f"/api/instances/{self.unshared_instance.id}/publish_to_library/",
            {"category": "math"},
            format="json",
        )
        entry = LibraryEntry.objects.get(instance=self.unshared_instance)
        self.assertEqual(entry.instance.id, self.unshared_instance.id)

        entry.delete()
        self.unshared_instance.library_entry = None
        self.unshared_instance.save(update_fields=["library_entry"])

    def test_publish_sets_library_entry_pointer(self):
        self.client.force_authenticate(user=self.author_user)
        self.client.put(
            f"/api/instances/{self.unshared_instance.id}/publish_to_library/",
            {"category": "math"},
            format="json",
        )
        self.unshared_instance.refresh_from_db()
        self.assertIsNotNone(self.unshared_instance.library_entry_id)

        LibraryEntry.objects.filter(instance=self.unshared_instance).delete()
        self.unshared_instance.library_entry = None
        self.unshared_instance.save(update_fields=["library_entry"])

    def test_banned_user_gets_403(self):
        settings = self.author_user.profile_settings
        settings.library_banned = True
        settings.save(update_fields=["library_banned"])
        self.client.force_authenticate(user=self.author_user)
        response = self.client.put(
            f"/api/instances/{self.unshared_instance.id}/publish_to_library/",
            {"category": "math"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        settings.library_banned = False
        settings.save(update_fields=["library_banned"])

    def test_missing_category_returns_400(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.put(
            f"/api/instances/{self.unshared_instance.id}/publish_to_library/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_category_returns_400(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.put(
            f"/api/instances/{self.unshared_instance.id}/publish_to_library/",
            {"category": "not_a_category"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_republish_updates_entry(self):
        """Re-publishing should update the existing entry's category and create new snapshot."""
        self.client.force_authenticate(user=self.author_user)
        old_snapshot_count = self.library_entry.snapshots.count()
        response = self.client.put(
            f"/api/instances/{self.shared_instance.id}/publish_to_library/",
            {"category": "history", "course_level": "advanced"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.library_entry.refresh_from_db()
        self.assertEqual(self.library_entry.category.slug, "history")
        self.assertEqual(self.library_entry.course_level, "advanced")
        self.assertEqual(self.library_entry.snapshots.count(), old_snapshot_count + 1)

        self.library_entry.category = self.categories["math"]
        self.library_entry.course_level = "introductory"
        self.library_entry.save(update_fields=["category", "course_level"])
        self.library_entry.snapshots.order_by("-created_at").first().delete()

    def test_no_orphan_instances_created(self):
        """Publishing should NOT create any new WidgetInstance records."""
        instance_count_before = WidgetInstance.objects.count()
        self.client.force_authenticate(user=self.author_user)
        self.client.put(
            f"/api/instances/{self.unshared_instance.id}/publish_to_library/",
            {"category": "math"},
            format="json",
        )
        instance_count_after = WidgetInstance.objects.count()
        self.assertEqual(instance_count_before, instance_count_after)

        LibraryEntry.objects.filter(instance=self.unshared_instance).delete()
        self.unshared_instance.library_entry = None
        self.unshared_instance.save(update_fields=["library_entry"])

    def test_republish_replaces_tags_and_updates_counts(self):
        self.client.force_authenticate(user=self.author_user)

        first_publish = self.client.put(
            f"/api/instances/{self.shared_instance.id}/publish_to_library/",
            {"category": "math", "tags": ["alpha", "beta"]},
            format="json",
        )
        self.assertEqual(first_publish.status_code, status.HTTP_200_OK)

        republish = self.client.put(
            f"/api/instances/{self.shared_instance.id}/publish_to_library/",
            {
                "category": "history",
                "tags": ["beta", "gamma", "gamma", "  gamma   "],
            },
            format="json",
        )
        self.assertEqual(republish.status_code, status.HTTP_200_OK)

        self.library_entry.refresh_from_db()
        self.assertSetEqual(
            set(self.library_entry.tags.values_list("name", flat=True)),
            {"beta", "gamma"},
        )

        self.assertFalse(Tag.objects.filter(name="alpha").exists())
        self.assertEqual(Tag.objects.get(name="beta").used_count, 1)
        self.assertEqual(Tag.objects.get(name="gamma").used_count, 1)

    def test_republish_is_idempotent_for_same_tags(self):
        self.client.force_authenticate(user=self.author_user)

        publish_payload = {"category": "math", "tags": ["alpha", "beta"]}
        first = self.client.put(
            f"/api/instances/{self.shared_instance.id}/publish_to_library/",
            publish_payload,
            format="json",
        )
        self.assertEqual(first.status_code, status.HTTP_200_OK)

        second = self.client.put(
            f"/api/instances/{self.shared_instance.id}/publish_to_library/",
            publish_payload,
            format="json",
        )
        self.assertEqual(second.status_code, status.HTTP_200_OK)

        self.library_entry.refresh_from_db()
        self.assertEqual(self.library_entry.tags.count(), 2)
        self.assertEqual(TagEntry.objects.filter(entry=self.library_entry).count(), 2)
        self.assertEqual(Tag.objects.get(name="alpha").used_count, 1)
        self.assertEqual(Tag.objects.get(name="beta").used_count, 1)

    def test_publish_deduplicates_case_variants(self):
        self.client.force_authenticate(user=self.author_user)

        response = self.client.put(
            f"/api/instances/{self.shared_instance.id}/publish_to_library/",
            {"category": "math", "tags": ["Algebra", "algebra", " ALGEBRA "]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.library_entry.refresh_from_db()
        self.assertEqual(self.library_entry.tags.count(), 1)
        self.assertTrue(Tag.objects.filter(normalized_name="algebra").exists())


class TestUpdateInLibrary(CommunityLibraryViewSetTestCase):
    """Tests for PUT /api/instances/{id}/update_in_library/"""

    def test_unauthenticated_returns_403(self):
        response = self.client.put(
            f"/api/instances/{self.shared_instance.id}/update_in_library/"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_update(self):
        WidgetQset.objects.create(
            instance=self.shared_instance,
            data="eyJ0ZXN0IjogImRhdGEifQ==",
            version="2",
        )
        self.client.force_authenticate(user=self.author_user)
        response = self.client.put(
            f"/api/instances/{self.shared_instance.id}/update_in_library/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

        self.library_entry.snapshots.order_by("-created_at").first().delete()

    def test_update_creates_new_snapshot(self):
        """Updating should create a new LibrarySnapshot with current data."""
        old_snapshot_count = self.library_entry.snapshots.count()
        self.shared_instance.name = "Updated Name"
        self.shared_instance.save(update_fields=["name"])
        WidgetQset.objects.create(
            instance=self.shared_instance,
            data="eyJ1cGRhdGVkIjogInFzZXQifQ==",
            version="2",
        )
        self.client.force_authenticate(user=self.author_user)
        self.client.put(f"/api/instances/{self.shared_instance.id}/update_in_library/")
        self.library_entry.refresh_from_db()
        new_snapshot = self.library_entry.snapshots.order_by("-created_at").first()
        self.assertEqual(self.library_entry.snapshots.count(), old_snapshot_count + 1)
        self.assertEqual(new_snapshot.name, "Updated Name")

        self.shared_instance.name = "Shared Instance"
        self.shared_instance.save(update_fields=["name"])
        new_snapshot.delete()

    def test_update_preserves_entry_stats(self):
        """Updating should not reset copy_count, like_count, etc."""
        copied_a = WidgetInstance.objects.create(
            id="upst0001",
            widget=self.widget,
            user=self.regular_user,
            name="Stats Copy A",
            is_draft=False,
            library_entry=self.library_entry,
            library_snapshot=self.library_snapshot,
        )
        copied_b = WidgetInstance.objects.create(
            id="upst0002",
            widget=self.widget,
            user=self.another_author,
            name="Stats Copy B",
            is_draft=False,
            library_entry=self.library_entry,
            library_snapshot=self.library_snapshot,
        )
        like_user_a = User.objects.create_user(
            username="stats_like_1",
            email="stats_like_1@example.com",
            password="testpass123",
        )
        like_user_b = User.objects.create_user(
            username="stats_like_2",
            email="stats_like_2@example.com",
            password="testpass123",
        )
        UserLike.objects.create(user=like_user_a, entry=self.library_entry)
        UserLike.objects.create(user=like_user_b, entry=self.library_entry)

        expected_copy_count = self.library_entry.copy_count
        expected_like_count = self.library_entry.like_count
        self.assertGreaterEqual(expected_copy_count, 2)
        self.assertGreaterEqual(expected_like_count, 2)

        self.client.force_authenticate(user=self.author_user)
        self.client.put(f"/api/instances/{self.shared_instance.id}/update_in_library/")
        self.library_entry.refresh_from_db()
        self.assertEqual(self.library_entry.copy_count, expected_copy_count)
        self.assertEqual(self.library_entry.like_count, expected_like_count)

        copied_a.delete()
        copied_b.delete()

        self.shared_instance.library_entry = self.library_entry
        self.shared_instance.save(update_fields=["library_entry"])

    def test_unpublish_preserves_entry_and_snapshots(self):
        """Unpublishing should keep entry/snapshots and clear instance.library_entry pointer."""
        entry_id = self.library_entry.id
        self.client.force_authenticate(user=self.author_user)
        self.client.put(
            f"/api/instances/{self.shared_instance.id}/unpublish_from_library/"
        )
        self.assertTrue(LibraryEntry.objects.filter(id=entry_id).exists())
        self.assertTrue(LibrarySnapshot.objects.filter(entry_id=entry_id).exists())
        self.shared_instance.refresh_from_db()
        self.assertIsNone(self.shared_instance.library_entry_id)

        self.shared_instance.library_entry = self.library_entry
        self.shared_instance.save(update_fields=["library_entry"])

    def test_unpublished_instance_not_in_library_list(self):
        self.client.force_authenticate(user=self.author_user)
        self.client.put(
            f"/api/instances/{self.shared_instance.id}/unpublish_from_library/"
        )
        response = self.client.get("/api/community-library/")
        instance_ids = [r["instance_id"] for r in response.data["results"]]
        self.assertNotIn(self.shared_instance.id, instance_ids)

        self.shared_instance.library_entry = self.library_entry
        self.shared_instance.save(update_fields=["library_entry"])

    def test_unpublish_removes_tag_entries_and_orphan_tags(self):
        self.client.force_authenticate(user=self.author_user)

        publish = self.client.put(
            f"/api/instances/{self.shared_instance.id}/publish_to_library/",
            {"category": "math", "tags": ["to-remove", "to-remove-2"]},
            format="json",
        )
        self.assertEqual(publish.status_code, status.HTTP_200_OK)

        unpublish = self.client.put(
            f"/api/instances/{self.shared_instance.id}/unpublish_from_library/"
        )
        self.assertEqual(unpublish.status_code, status.HTTP_200_OK)

        self.assertEqual(TagEntry.objects.filter(entry=self.library_entry).count(), 0)
        self.assertFalse(Tag.objects.filter(name="to-remove").exists())
        self.assertFalse(Tag.objects.filter(name="to-remove-2").exists())

    def test_pull_from_library_rejects_unpublished_entry(self):
        self.client.force_authenticate(user=self.regular_user)
        copy_response = self.client.post(
            f"/api/community-library/{self.library_entry.id}/copy/"
        )
        copied_instance_id = copy_response.data["id"]

        self.library_entry.is_available = False
        self.library_entry.save(update_fields=["is_available"])

        response = self.client.put(
            f"/api/instances/{copied_instance_id}/pull_from_library/"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            response.data["error"], "This library entry is no longer published."
        )

        self.library_entry.is_available = True
        self.library_entry.save(update_fields=["is_available"])

    def test_pull_from_library_without_snapshot_returns_400(self):
        self.client.force_authenticate(user=self.regular_user)
        copy_response = self.client.post(
            f"/api/community-library/{self.library_entry.id}/copy/"
        )
        copied_instance_id = copy_response.data["id"]

        self.library_entry.snapshots.all().delete()

        response = self.client.put(
            f"/api/instances/{copied_instance_id}/pull_from_library/"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["error"],
            "This library entry has no snapshots to pull from.",
        )


class TestSnapshotEndpoints(CommunityLibraryViewSetTestCase):
    """Tests for GET /api/community-library/{id}/snapshot_instance/ and snapshot_qset/"""

    def test_snapshot_instance_returns_data(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.get(
            f"/api/community-library/{self.library_entry.id}/snapshot_instance/{self.library_snapshot.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Shared Instance")
        self.assertIn("widget", response.data)

    def test_snapshot_qset_returns_data(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.get(
            f"/api/community-library/{self.library_entry.id}/snapshot_qset/{self.library_snapshot.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("data", response.data)

    def test_snapshot_instance_unauthenticated_returns_403(self):
        response = self.client.get(
            f"/api/community-library/{self.library_entry.id}/snapshot_instance/{self.library_snapshot.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TestCommunityLibraryTags(CommunityLibraryViewSetTestCase):
    def test_tags_endpoint_returns_list_payload(self):
        Tag.objects.create(name="z-tag", used_count=1)
        Tag.objects.create(name="a-tag", used_count=2)

        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/community-library/tags/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(response.data[0]["name"], "a-tag")

    def test_tag_delete_missing_tag_returns_400(self):
        self.client.force_authenticate(user=self.support_user)
        response = self.client.delete(
            "/api/community-library/tags/?name=does-not-exist"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_tag_rename_conflict_is_case_insensitive(self):
        Tag.objects.create(name="Physics")
        Tag.objects.create(name="Chemistry")

        self.client.force_authenticate(user=self.support_user)
        response = self.client.patch(
            "/api/community-library/tags/?name=Physics&to=chemistry"
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)


class TestCommunityLibraryCategories(CommunityLibraryViewSetTestCase):
    """Tests for GET/POST/PATCH/DELETE /api/community-library/categories/"""

    def test_categories_get_returns_200(self):
        response = self.client.get("/api/community-library/categories/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(c["slug"] == "other" for c in response.data))

    def test_categories_write_requires_elevated_user(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            "/api/community-library/categories/?slug=new-cat",
            {"label": "New Cat"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_categories_post_duplicate_slug_returns_409(self):
        self.client.force_authenticate(user=self.support_user)
        response = self.client.post(
            "/api/community-library/categories/?slug=math",
            {"label": "Math Duplicate"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_categories_post_creates_category(self):
        self.client.force_authenticate(user=self.support_user)
        response = self.client.post(
            "/api/community-library/categories/?slug=language-arts",
            {
                "label": "Language Arts",
                "banner_path": "/static/img/banners/banner_lang.svg",
                "color": "#112233",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["slug"], "language-arts")
        self.assertEqual(response.data["label"], "Language Arts")

    def test_categories_patch_missing_slug_returns_400(self):
        self.client.force_authenticate(user=self.support_user)
        response = self.client.patch(
            "/api/community-library/categories/?slug=does-not-exist",
            {"label": "Nope"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_categories_patch_updates_existing_category(self):
        self.client.force_authenticate(user=self.support_user)
        response = self.client.patch(
            "/api/community-library/categories/?slug=science",
            {"label": "Sci", "color": "#abcdef"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        updated = LibraryCategory.objects.get(slug="science")
        self.assertEqual(updated.label, "Sci")
        self.assertEqual(updated.color, "#abcdef")

    def test_categories_delete_missing_slug_returns_400(self):
        self.client.force_authenticate(user=self.support_user)
        response = self.client.delete(
            "/api/community-library/categories/?slug=does-not-exist"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_categories_delete_other_returns_403(self):
        self.client.force_authenticate(user=self.support_user)
        response = self.client.delete("/api/community-library/categories/?slug=other")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_categories_delete_reassigns_entries_to_other(self):
        category = LibraryCategory.objects.create(
            slug="temp-delete",
            label="Temp Delete",
            banner_path="/static/img/banners/banner_math.svg",
        )
        temp_instance = WidgetInstance.objects.create(
            id="catdel01",
            widget=self.widget,
            user=self.author_user,
            name="Category Delete Instance",
            is_draft=False,
        )
        temp_entry = LibraryEntry.objects.create(
            instance=temp_instance,
            category=category,
            course_level="introductory",
        )

        self.client.force_authenticate(user=self.support_user)
        response = self.client.delete(
            "/api/community-library/categories/?slug=temp-delete"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        temp_entry.refresh_from_db()
        self.assertEqual(temp_entry.category.slug, "other")
        self.assertFalse(LibraryCategory.objects.filter(slug="temp-delete").exists())
