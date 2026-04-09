from unittest.mock import patch

from core.models import (
    CommunityLibraryEntry,
    LibraryReport,
    LibrarySnapshot,
    Notification,
    ObjectPermission,
    UserLike,
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
            is_editable=True,
            is_playable=True,
            is_scorable=True,
        )

        cls.another_widget = Widget.objects.create(
            name="Another Widget",
            clean_name="another-widget",
            is_editable=True,
            is_playable=True,
        )

        cls.shared_instance = WidgetInstance.objects.create(
            id="shared001",
            widget=cls.widget,
            user=cls.author_user,
            name="Shared Instance",
            is_draft=False,
            is_shared=True,
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

        cls.library_entry = CommunityLibraryEntry.objects.create(
            instance=cls.shared_instance,
            category="math",
            course_level="introductory",
        )
        cls.library_snapshot = LibrarySnapshot.objects.create(
            entry=cls.library_entry,
            name="Shared Instance",
            qset_data="eyJ0ZXN0IjogImRhdGEifQ==",
            qset_version="1",
        )

        cls.shared_instance_2 = WidgetInstance.objects.create(
            id="shared002",
            widget=cls.another_widget,
            user=cls.another_author,
            name="Alpha Instance",
            is_draft=False,
            is_shared=True,
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

        cls.library_entry_2 = CommunityLibraryEntry.objects.create(
            instance=cls.shared_instance_2,
            category="science",
            course_level="advanced",
            copy_count=10,
            like_count=5,
        )
        LibrarySnapshot.objects.create(
            entry=cls.library_entry_2,
            name="Alpha Instance",
            qset_data="eyJ0ZXN0IjogImRhdGEifQ==",
            qset_version="1",
        )

        cls.unshared_instance = WidgetInstance.objects.create(
            id="unshare1",
            widget=cls.widget,
            user=cls.author_user,
            name="Unshared Instance",
            is_draft=False,
            is_shared=False,
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

    def test_unauthenticated_returns_403(self):
        response = self.client.get("/api/community-library/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_returns_published_entries(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/community-library/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        instance_ids = [r["instance_id"] for r in response.data["results"]]
        self.assertIn(self.shared_instance.id, instance_ids)
        self.assertIn(self.shared_instance_2.id, instance_ids)

    def test_excludes_unshared_instance(self):
        """Entries whose instance.is_shared=False should not appear."""
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
        self.assertEqual(entry["owner_display_name"], "Jane D.")

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

    def test_copied_instance_is_not_shared(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            f"/api/community-library/{self.library_entry.id}/copy/"
        )
        new_instance = WidgetInstance.objects.get(pk=response.data["id"])
        self.assertFalse(new_instance.is_shared)

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
    """Tests for POST /api/community-library/{id}/report/"""

    def test_unauthenticated_returns_403(self):
        response = self.client.post(
            f"/api/community-library/{self.library_entry.id}/report/",
            {"reason": "spam"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_valid_report_creates_report(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            f"/api/community-library/{self.library_entry.id}/report/",
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
            f"/api/community-library/{self.library_entry.id}/report/",
            {"reason": "inappropriate"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_report_increments_report_count(self):
        original_count = self.library_entry.report_count
        self.client.force_authenticate(user=self.regular_user)
        self.client.post(
            f"/api/community-library/{self.library_entry.id}/report/",
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
            f"/api/community-library/{self.library_entry.id}/report/",
            {"reason": "spam"},
            format="json",
        )
        self.library_entry.refresh_from_db()
        self.assertTrue(self.library_entry.is_banned)

        self.library_entry.is_banned = False
        self.library_entry.report_count = 0
        self.library_entry.save(update_fields=["is_banned", "report_count"])

    @patch("api.views.community_library.REPORT_THRESHOLD", 1)
    @patch("core.models.Notification.send_email")
    def test_report_at_threshold_creates_admin_notifications(self, mock_send_email):
        self.client.force_authenticate(user=self.regular_user)
        self.client.post(
            f"/api/community-library/{self.library_entry.id}/report/",
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
        self.library_entry.report_count = 0
        self.library_entry.save(update_fields=["is_banned", "report_count"])

    def test_missing_reason_returns_400(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            f"/api/community-library/{self.library_entry.id}/report/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_reason_returns_400(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            f"/api/community-library/{self.library_entry.id}/report/",
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
        self.assertTrue(self.unshared_instance.is_shared)
        entry = CommunityLibraryEntry.objects.get(instance=self.unshared_instance)
        self.assertEqual(entry.category, "science")
        self.assertEqual(entry.course_level, "intermediate")

        entry.delete()
        self.unshared_instance.is_shared = False
        self.unshared_instance.save(update_fields=["is_shared"])

    def test_publish_creates_snapshot(self):
        """Publishing should create a LibrarySnapshot record."""
        self.client.force_authenticate(user=self.author_user)
        self.client.put(
            f"/api/instances/{self.unshared_instance.id}/publish_to_library/",
            {"category": "math"},
            format="json",
        )
        entry = CommunityLibraryEntry.objects.get(instance=self.unshared_instance)
        snapshot = entry.snapshots.first()
        self.assertIsNotNone(snapshot)
        self.assertEqual(snapshot.name, self.unshared_instance.name)

        entry.delete()
        self.unshared_instance.is_shared = False
        self.unshared_instance.save(update_fields=["is_shared"])

    def test_snapshot_has_correct_qset(self):
        """Snapshot should have a copy of the instance's qset data."""
        self.client.force_authenticate(user=self.author_user)
        self.client.put(
            f"/api/instances/{self.unshared_instance.id}/publish_to_library/",
            {"category": "math"},
            format="json",
        )
        entry = CommunityLibraryEntry.objects.get(instance=self.unshared_instance)
        snapshot = entry.snapshots.first()
        source_qset = self.unshared_instance.get_latest_qset()
        self.assertIsNotNone(snapshot)
        self.assertEqual(snapshot.qset_data, source_qset.data)
        self.assertEqual(snapshot.qset_version, source_qset.version)

        entry.delete()
        self.unshared_instance.is_shared = False
        self.unshared_instance.save(update_fields=["is_shared"])

    def test_entry_instance_points_to_original(self):
        """Entry's instance should point to the original widget."""
        self.client.force_authenticate(user=self.author_user)
        self.client.put(
            f"/api/instances/{self.unshared_instance.id}/publish_to_library/",
            {"category": "math"},
            format="json",
        )
        entry = CommunityLibraryEntry.objects.get(instance=self.unshared_instance)
        self.assertEqual(entry.instance.id, self.unshared_instance.id)

        entry.delete()
        self.unshared_instance.is_shared = False
        self.unshared_instance.save(update_fields=["is_shared"])

    def test_publish_sets_is_shared_true(self):
        self.client.force_authenticate(user=self.author_user)
        self.client.put(
            f"/api/instances/{self.unshared_instance.id}/publish_to_library/",
            {"category": "math"},
            format="json",
        )
        self.unshared_instance.refresh_from_db()
        self.assertTrue(self.unshared_instance.is_shared)

        CommunityLibraryEntry.objects.filter(instance=self.unshared_instance).delete()
        self.unshared_instance.is_shared = False
        self.unshared_instance.save(update_fields=["is_shared"])

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
        self.assertEqual(self.library_entry.category, "history")
        self.assertEqual(self.library_entry.course_level, "advanced")
        self.assertEqual(self.library_entry.snapshots.count(), old_snapshot_count + 1)

        self.library_entry.category = "math"
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

        CommunityLibraryEntry.objects.filter(instance=self.unshared_instance).delete()
        self.unshared_instance.is_shared = False
        self.unshared_instance.save(update_fields=["is_shared"])


class TestUpdateInLibrary(CommunityLibraryViewSetTestCase):
    """Tests for PUT /api/instances/{id}/update_in_library/"""

    def test_unauthenticated_returns_403(self):
        response = self.client.put(
            f"/api/instances/{self.shared_instance.id}/update_in_library/"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_update(self):
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
        self.library_entry.copy_count = 42
        self.library_entry.like_count = 10
        self.library_entry.save(update_fields=["copy_count", "like_count"])
        self.client.force_authenticate(user=self.author_user)
        self.client.put(f"/api/instances/{self.shared_instance.id}/update_in_library/")
        self.library_entry.refresh_from_db()
        self.assertEqual(self.library_entry.copy_count, 42)
        self.assertEqual(self.library_entry.like_count, 10)

        self.shared_instance.is_shared = True
        self.shared_instance.save(update_fields=["is_shared"])

    def test_unpublish_preserves_entry_and_snapshots(self):
        """Unpublishing should keep the entry and snapshots, only set is_shared=False."""
        entry_id = self.library_entry.id
        self.client.force_authenticate(user=self.author_user)
        self.client.put(
            f"/api/instances/{self.shared_instance.id}/unpublish_from_library/"
        )
        self.assertTrue(CommunityLibraryEntry.objects.filter(id=entry_id).exists())
        self.assertTrue(LibrarySnapshot.objects.filter(entry_id=entry_id).exists())
        self.shared_instance.refresh_from_db()
        self.assertFalse(self.shared_instance.is_shared)

        self.shared_instance.is_shared = True
        self.shared_instance.save(update_fields=["is_shared"])

    def test_unpublished_instance_not_in_library_list(self):
        self.client.force_authenticate(user=self.author_user)
        self.client.put(
            f"/api/instances/{self.shared_instance.id}/unpublish_from_library/"
        )
        response = self.client.get("/api/community-library/")
        instance_ids = [r["instance_id"] for r in response.data["results"]]
        self.assertNotIn(self.shared_instance.id, instance_ids)

        self.shared_instance.is_shared = True
        self.shared_instance.save(update_fields=["is_shared"])


class TestSnapshotEndpoints(CommunityLibraryViewSetTestCase):
    """Tests for GET /api/community-library/{id}/snapshot_instance/ and snapshot_qset/"""

    def test_snapshot_instance_returns_data(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(
            f"/api/community-library/{self.library_entry.id}/snapshot_instance/{self.library_snapshot.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Shared Instance")
        self.assertIn("widget", response.data)

    def test_snapshot_qset_returns_data(self):
        self.client.force_authenticate(user=self.regular_user)
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
