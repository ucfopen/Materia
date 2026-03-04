import uuid
from unittest.mock import patch

from api.tests.base import MateriaTestCase
from core.models import (
    DateRange,
    LogPlay,
    ObjectPermission,
    Widget,
    WidgetInstance,
    WidgetQset,
)
from django.contrib.auth.models import User
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient


class WidgetInstanceViewSetTestCase(MateriaTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.regular_user = User.objects.create_user(
            username="regular",
            email="regular@example.com",
            password="testpass123",
        )

        cls.author_user = User.objects.create_user(
            username="author",
            email="author@example.com",
            password="testpass123",
        )
        cls.author_user.groups.add(cls.author_group)

        cls.another_author = User.objects.create_user(
            username="another_author",
            email="another_author@example.com",
            password="testpass123",
        )
        cls.another_author.groups.add(cls.author_group)

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

        cls.no_author_user = User.objects.create_user(
            username="noauthor",
            email="noauthor@example.com",
            password="testpass123",
        )
        cls.no_author_user.groups.add(cls.no_author_group)

        # DateRanges are now populated by MateriaTestCase
        cls.semester = DateRange.objects.filter(semester="fall", year=2024).first()

        cls.widget = Widget.objects.create(
            name="Test Widget",
            clean_name="test-widget",
            is_editable=True,
            is_playable=True,
            is_scorable=True,
        )

        cls.non_editable_widget = Widget.objects.create(
            name="Non-Editable Widget",
            clean_name="non-editable-widget",
            is_editable=False,
            is_playable=True,
        )

        cls.author_instance = WidgetInstance.objects.create(
            id="author001",
            widget=cls.widget,
            user=cls.author_user,
            name="Author Instance",
            is_draft=False,
            guest_access=False,
        )
        ObjectPermission.objects.create(
            user=cls.author_user,
            content_object=cls.author_instance,
            permission=ObjectPermission.PERMISSION_FULL,
        )

        cls.guest_instance = WidgetInstance.objects.create(
            id="guest001",
            widget=cls.widget,
            user=cls.author_user,
            name="Guest Instance",
            is_draft=False,
            guest_access=True,
        )
        ObjectPermission.objects.create(
            user=cls.author_user,
            content_object=cls.guest_instance,
            permission=ObjectPermission.PERMISSION_FULL,
        )

        cls.draft_instance = WidgetInstance.objects.create(
            id="draft001",
            widget=cls.widget,
            user=cls.author_user,
            name="Draft Instance",
            is_draft=True,
            guest_access=False,
        )
        ObjectPermission.objects.create(
            user=cls.author_user,
            content_object=cls.draft_instance,
            permission=ObjectPermission.PERMISSION_FULL,
        )

        cls.deleted_instance = WidgetInstance.objects.create(
            id="deleted01",
            widget=cls.widget,
            user=cls.author_user,
            name="Deleted Instance",
            is_draft=False,
            guest_access=False,
            is_deleted=True,
        )
        ObjectPermission.objects.create(
            user=cls.author_user,
            content_object=cls.deleted_instance,
            permission=ObjectPermission.PERMISSION_FULL,
        )

        cls.student_instance = WidgetInstance.objects.create(
            id="student01",
            widget=cls.widget,
            user=cls.regular_user,
            name="Student Instance",
            is_draft=False,
            guest_access=True,
            is_student_made=True,
        )
        ObjectPermission.objects.create(
            user=cls.regular_user,
            content_object=cls.student_instance,
            permission=ObjectPermission.PERMISSION_FULL,
        )

        cls.another_author_instance = WidgetInstance.objects.create(
            id="another01",
            widget=cls.widget,
            user=cls.another_author,
            name="Another Author Instance",
            is_draft=False,
            guest_access=False,
        )
        ObjectPermission.objects.create(
            user=cls.another_author,
            content_object=cls.another_author_instance,
            permission=ObjectPermission.PERMISSION_FULL,
        )

        cls.shared_instance = WidgetInstance.objects.create(
            id="shared001",
            widget=cls.widget,
            user=cls.author_user,
            name="Shared Instance",
            is_draft=False,
            guest_access=False,
        )
        ObjectPermission.objects.create(
            user=cls.author_user,
            content_object=cls.shared_instance,
            permission=ObjectPermission.PERMISSION_FULL,
        )
        ObjectPermission.objects.create(
            user=cls.another_author,
            content_object=cls.shared_instance,
            permission=ObjectPermission.PERMISSION_VISIBLE,
        )

        cls.author_qset = WidgetQset.objects.create(
            instance=cls.author_instance,
            data="eyJ0ZXN0IjogImRhdGEifQ==",
            version="1",
        )

        cls.guest_qset = WidgetQset.objects.create(
            instance=cls.guest_instance,
            data="eyJ0ZXN0IjogImRhdGEifQ==",
            version="1",
        )

        cls.completed_play = LogPlay.objects.create(
            id=str(uuid.uuid4()),
            instance=cls.author_instance,
            user=cls.regular_user,
            is_valid=False,
            is_complete=True,
            score=85,
            score_possible=100,
            percent=85.0,
            elapsed=300,
            qset=cls.author_qset,
            ip="127.0.0.1",
            auth="",
            referrer_url="",
            context_id="",
            semester=cls.semester,
        )

    def setUp(self):
        self.client = APIClient()


class TestInstanceList(WidgetInstanceViewSetTestCase):
    #     """Tests for GET /api/instances/"""

    def test_unauthenticated_returns_403(self):
        response = self.client.get("/api/instances/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_without_user_filter_returns_403(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.get("/api/instances/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_with_user_me_returns_own_instances(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.get("/api/instances/", {"user": "me"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        instance_ids = [inst["id"] for inst in response.data["results"]]
        self.assertIn(self.author_instance.id, instance_ids)
        self.assertIn(self.guest_instance.id, instance_ids)
        self.assertNotIn(self.another_author_instance.id, instance_ids)

    def test_superuser_can_list_all_without_filter(self):
        self.client.force_authenticate(user=self.superuser)
        response = self.client.get("/api/instances/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data["results"]), 0)

    def test_support_user_can_list_all_without_filter(self):
        self.client.force_authenticate(user=self.support_user)
        response = self.client.get("/api/instances/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_excludes_deleted_instances_for_regular_user(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.get("/api/instances/", {"user": "me"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        instance_ids = [inst["id"] for inst in response.data["results"]]
        self.assertNotIn(self.deleted_instance.id, instance_ids)

    def test_list_returns_paginated_results(self):
        self.client.force_authenticate(user=self.superuser)
        response = self.client.get("/api/instances/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertIn("count", response.data)


class TestInstanceCreate(WidgetInstanceViewSetTestCase):
    #     """Tests for POST /api/instances/"""

    def test_unauthenticated_returns_403(self):
        response = self.client.post(
            "/api/instances/",
            {"name": "New Instance", "widget_id": self.widget.id, "is_draft": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_author_can_create_instance(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.post(
            "/api/instances/",
            {"name": "New Instance", "widget_id": self.widget.id, "is_draft": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "New Instance")
        self.assertTrue(response.data["is_draft"])

    def test_no_author_user_cannot_create_instance(self):
        self.client.force_authenticate(user=self.no_author_user)
        response = self.client.post(
            "/api/instances/",
            {"name": "New Instance", "widget_id": self.widget.id, "is_draft": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_instance_sets_owner(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.post(
            "/api/instances/",
            {"name": "New Instance", "widget_id": self.widget.id, "is_draft": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["user_id"], self.author_user.id)

    def test_create_instance_creates_owner_permission(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.post(
            "/api/instances/",
            {"name": "New Instance", "widget_id": self.widget.id, "is_draft": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        instance_id = response.data["id"]
        instance = WidgetInstance.objects.get(id=instance_id)
        perm = instance.permissions.filter(user=self.author_user).first()
        self.assertIsNotNone(perm)
        self.assertEqual(perm.permission, ObjectPermission.PERMISSION_FULL)

    def test_cannot_create_with_non_editable_widget(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.post(
            "/api/instances/",
            {
                "name": "New Instance",
                "widget_id": self.non_editable_widget.id,
                "is_draft": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_creates_student_made_instance(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            "/api/instances/",
            {"name": "Student Widget", "widget_id": self.widget.id, "is_draft": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["is_student_made"])
        self.assertTrue(response.data["guest_access"])

    def test_create_instance_with_qset(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.post(
            "/api/instances/",
            {
                "name": "Instance With Qset",
                "widget_id": self.widget.id,
                "is_draft": True,
                "qset": {"data": "eyJ0ZXN0IjogImRhdGEifQ==", "version": 1},
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        instance = WidgetInstance.objects.get(id=response.data["id"])
        self.assertIsNotNone(instance.get_latest_qset())


class TestInstanceRetrieve(WidgetInstanceViewSetTestCase):
    """Tests for GET /api/instances/{id}/"""

    def test_unauthenticated_can_retrieve_guest_instance(self):
        response = self.client.get(f"/api/instances/{self.guest_instance.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.guest_instance.id)

    def test_unauthenticated_can_retrieve_non_guest_instance(self):
        response = self.client.get(f"/api/instances/{self.author_instance.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_hides_user_id_when_not_playable(self):
        response = self.client.get(f"/api/instances/{self.author_instance.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("user_id", response.data)

    def test_shows_user_id_for_guest_instance(self):
        response = self.client.get(f"/api/instances/{self.guest_instance.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("user_id", response.data)

    def test_authenticated_user_sees_user_id(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(f"/api/instances/{self.author_instance.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("user_id", response.data)

    def test_retrieve_returns_widget_data(self):
        response = self.client.get(f"/api/instances/{self.guest_instance.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("widget", response.data)
        self.assertEqual(response.data["widget"]["id"], self.widget.id)

    def test_retrieve_nonexistent_returns_404(self):
        response = self.client.get("/api/instances/nonexist01/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class TestInstanceUpdate(WidgetInstanceViewSetTestCase):
    """Tests for PATCH /api/instances/{id}/"""

    @patch(
        "api.permissions.WidgetInstanceService.user_has_lock_or_is_unlocked",
        return_value=True,
    )
    def test_unauthenticated_returns_403(self, mock_lock):
        response = self.client.patch(
            f"/api/instances/{self.author_instance.id}/",
            {"name": "Updated Name"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch(
        "api.permissions.WidgetInstanceService.user_has_lock_or_is_unlocked",
        return_value=True,
    )
    def test_owner_with_lock_can_update(self, mock_lock):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.patch(
            f"/api/instances/{self.author_instance.id}/",
            {"name": "Updated Name"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Updated Name")

    @patch(
        "api.permissions.WidgetInstanceService.user_has_lock_or_is_unlocked",
        return_value=True,
    )
    def test_non_owner_without_perms_cannot_update(self, mock_lock):
        self.client.force_authenticate(user=self.another_author)
        response = self.client.patch(
            f"/api/instances/{self.author_instance.id}/",
            {"name": "Hacked Name"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch(
        "api.permissions.WidgetInstanceService.user_has_lock_or_is_unlocked",
        return_value=True,
    )
    def test_superuser_can_update_any_instance(self, mock_lock):
        self.client.force_authenticate(user=self.superuser)
        response = self.client.patch(
            f"/api/instances/{self.author_instance.id}/",
            {"name": "Superuser Updated"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch(
        "api.permissions.WidgetInstanceService.user_has_lock_or_is_unlocked",
        return_value=True,
    )
    def test_student_made_cannot_disable_guest_access(self, mock_lock):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.patch(
            f"/api/instances/{self.student_instance.id}/",
            {"name": "Updated Student Instance", "guest_access": False},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch(
        "api.permissions.WidgetInstanceService.user_has_lock_or_is_unlocked",
        return_value=False,
    )
    def test_update_without_lock_fails(self, mock_lock):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.patch(
            f"/api/instances/{self.author_instance.id}/",
            {"name": "Should Fail"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TestInstancePutUpdate(WidgetInstanceViewSetTestCase):
    """Tests for PUT /api/instances/{id}/ (full replacement)"""

    @patch(
        "api.permissions.WidgetInstanceService.user_has_lock_or_is_unlocked",
        return_value=True,
    )
    def test_put_requires_widget_id(self, mock_lock):
        """PUT without widget_id should fail with 400"""
        self.client.force_authenticate(user=self.author_user)
        response = self.client.put(
            f"/api/instances/{self.author_instance.id}/",
            {"name": "Updated Name", "is_draft": False},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch(
        "api.permissions.WidgetInstanceService.user_has_lock_or_is_unlocked",
        return_value=True,
    )
    def test_put_with_widget_id_succeeds(self, mock_lock):
        """PUT with all required fields should succeed"""
        self.client.force_authenticate(user=self.author_user)
        response = self.client.put(
            f"/api/instances/{self.author_instance.id}/",
            {
                "name": "Updated Name",
                "is_draft": False,
                "widget_id": self.widget.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Updated Name")

    @patch(
        "api.permissions.WidgetInstanceService.user_has_lock_or_is_unlocked",
        return_value=True,
    )
    def test_put_unauthenticated_returns_403(self, mock_lock):
        """PUT without authentication should fail"""
        response = self.client.put(
            f"/api/instances/{self.author_instance.id}/",
            {
                "name": "Updated Name",
                "is_draft": False,
                "widget_id": self.widget.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TestInstanceUpdateValidation(WidgetInstanceViewSetTestCase):
    """Tests for perform_update validation logic"""

    @patch(
        "api.permissions.WidgetInstanceService.user_has_lock_or_is_unlocked",
        return_value=True,
    )
    def test_non_editable_widget_returns_validation_error(self, mock_lock):
        """Ensures users cannot update instances of non-editable widgets"""
        non_editable_instance = WidgetInstance.objects.create(
            id="nonedit01",
            widget=self.non_editable_widget,
            user=self.author_user,
            name="Non-Editable Instance",
            is_draft=True,
        )
        ObjectPermission.objects.create(
            user=self.author_user,
            content_object=non_editable_instance,
            permission=ObjectPermission.PERMISSION_FULL,
        )

        self.client.force_authenticate(user=self.author_user)
        response = self.client.patch(
            f"/api/instances/{non_editable_instance.id}/",
            {"name": "Should Fail"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Non-editable widgets cannot be updated", str(response.content))

    @patch(
        "api.permissions.WidgetInstanceService.user_has_lock_or_is_unlocked",
        return_value=True,
    )
    def test_cannot_publish_restricted_widget_returns_validation_error(self, mock_lock):
        """Ensures students cannot publish widgets with restrict_publish enabled"""
        restricted_widget = Widget.objects.create(
            name="Restricted Widget",
            clean_name="restricted-widget",
            is_editable=True,
            is_playable=True,
            restrict_publish=True,
        )
        restricted_instance = WidgetInstance.objects.create(
            id="restrict1",
            widget=restricted_widget,
            user=self.regular_user,
            name="Restricted Instance",
            is_draft=True,
            is_student_made=True,
            guest_access=True,
        )
        ObjectPermission.objects.create(
            user=self.regular_user,
            content_object=restricted_instance,
            permission=ObjectPermission.PERMISSION_FULL,
        )

        self.client.force_authenticate(user=self.regular_user)
        response = self.client.patch(
            f"/api/instances/{restricted_instance.id}/",
            {"is_draft": False},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("You cannot publish this widget", str(response.content))

    @patch(
        "api.permissions.WidgetInstanceService.user_has_lock_or_is_unlocked",
        return_value=True,
    )
    def test_student_made_guest_access_false_returns_validation_error(self, mock_lock):
        """Ensures student-made widgets cannot have guest access disabled"""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.patch(
            f"/api/instances/{self.student_instance.id}/",
            {"guest_access": False},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn(
            "Student-made widgets must stay in guest access mode", str(response.content)
        )

    @patch(
        "api.permissions.WidgetInstanceService.user_has_lock_or_is_unlocked",
        return_value=True,
    )
    def test_student_made_attempts_forced_to_negative_one(self, mock_lock):
        """Ensures student-made widgets always have unlimited attempts (-1)"""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.patch(
            f"/api/instances/{self.student_instance.id}/",
            {"name": "Updated", "attempts": 5},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student_instance.refresh_from_db()
        self.assertEqual(self.student_instance.attempts, -1)

    @patch(
        "api.permissions.WidgetInstanceService.user_has_lock_or_is_unlocked",
        return_value=True,
    )
    def test_published_by_set_on_first_publish(self, mock_lock):
        """Ensures published_by is set to current user when a draft is first published"""
        self.assertIsNone(self.draft_instance.published_by)

        self.client.force_authenticate(user=self.author_user)
        response = self.client.patch(
            f"/api/instances/{self.draft_instance.id}/",
            {"is_draft": False},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.draft_instance.refresh_from_db()
        self.assertEqual(self.draft_instance.published_by, self.author_user)

    @patch(
        "api.permissions.WidgetInstanceService.user_has_lock_or_is_unlocked",
        return_value=True,
    )
    def test_disabling_guest_access_removes_student_permissions(self, mock_lock):
        """Ensures student permissions are revoked when guest access is disabled"""
        # Add student permission
        ObjectPermission.objects.create(
            user=self.regular_user,
            content_object=self.guest_instance,
            permission=ObjectPermission.PERMISSION_VISIBLE,
        )

        self.client.force_authenticate(user=self.author_user)
        response = self.client.patch(
            f"/api/instances/{self.guest_instance.id}/",
            {"guest_access": False},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(
            self.guest_instance.permissions.filter(user=self.regular_user).exists()
        )

    @patch(
        "api.permissions.WidgetInstanceService.user_has_lock_or_is_unlocked",
        return_value=True,
    )
    def test_disabling_guest_access_keeps_non_student_permissions(self, mock_lock):
        """Ensures author permissions are preserved when guest access is disabled"""
        # Add author permission (should NOT be removed)
        ObjectPermission.objects.create(
            user=self.another_author,
            content_object=self.guest_instance,
            permission=ObjectPermission.PERMISSION_VISIBLE,
        )

        self.client.force_authenticate(user=self.author_user)
        response = self.client.patch(
            f"/api/instances/{self.guest_instance.id}/",
            {"guest_access": False},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            self.guest_instance.permissions.filter(user=self.another_author).exists()
        )


class TestInstanceDestroy(WidgetInstanceViewSetTestCase):
    """Tests for DELETE /api/instances/{id}/"""

    def test_unauthenticated_returns_403(self):
        response = self.client.delete(f"/api/instances/{self.author_instance.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_delete(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.delete(f"/api/instances/{self.draft_instance.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.draft_instance.refresh_from_db()
        self.assertTrue(self.draft_instance.is_deleted)

    def test_non_owner_cannot_delete(self):
        self.client.force_authenticate(user=self.another_author)
        response = self.client.delete(f"/api/instances/{self.author_instance.id}/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_superuser_can_delete_any(self):
        instance = WidgetInstance.objects.create(
            id="todel001",
            widget=self.widget,
            user=self.author_user,
            name="To Delete",
            is_draft=False,
        )
        ObjectPermission.objects.create(
            user=self.author_user,
            content_object=instance,
            permission=ObjectPermission.PERMISSION_FULL,
        )

        self.client.force_authenticate(user=self.superuser)
        response = self.client.delete(f"/api/instances/{instance.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_is_soft_delete(self):
        instance = WidgetInstance.objects.create(
            id="soft001",
            widget=self.widget,
            user=self.author_user,
            name="Soft Delete Test",
            is_draft=False,
        )
        ObjectPermission.objects.create(
            user=self.author_user,
            content_object=instance,
            permission=ObjectPermission.PERMISSION_FULL,
        )

        self.client.force_authenticate(user=self.author_user)
        response = self.client.delete(f"/api/instances/{instance.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        instance.refresh_from_db()
        self.assertTrue(instance.is_deleted)
        self.assertTrue(WidgetInstance.objects.filter(id=instance.id).exists())


class TestInstanceQuestionSets(WidgetInstanceViewSetTestCase):
    """Tests for GET /api/instances/{id}/question_sets/"""

    def test_anyone_can_get_qsets(self):
        response = self.client.get(
            f"/api/instances/{self.author_instance.id}/question_sets/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_get_latest_qset(self):
        response = self.client.get(
            f"/api/instances/{self.author_instance.id}/question_sets/",
            {"latest": "true"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.author_qset.id)

    def test_get_qset_by_play_id(self):
        """Ensures qset can be retrieved using a play_id"""
        response = self.client.get(
            f"/api/instances/{self.author_instance.id}/question_sets/",
            {"play_id": str(self.completed_play.id)},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.author_qset.id)


class TestInstanceQuestionSet(WidgetInstanceViewSetTestCase):
    """Tests for GET /api/instances/{id}/question_sets/{qset_id}/"""

    def test_anyone_can_get_specific_qset(self):
        """Unauthenticated user can retrieve a specific qset"""
        response = self.client.get(
            f"/api/instances/{self.author_instance.id}/question_sets/{self.author_qset.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.author_qset.id)

    def test_returns_qset_data(self):
        """Returns correct qset data"""
        self.client.force_authenticate(user=self.author_user)
        response = self.client.get(
            f"/api/instances/{self.author_instance.id}/question_sets/{self.author_qset.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.author_qset.id)
        self.assertIn("data", response.data)

    def test_nonexistent_qset_returns_empty_data(self):
        """Returns empty response for non-existent qset"""
        response = self.client.get(
            f"/api/instances/{self.author_instance.id}/question_sets/99999/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("id", response.data)

    def test_qset_from_different_instance_returns_empty(self):
        """Returns empty response when qset belongs to different instance"""
        response = self.client.get(
            f"/api/instances/{self.another_author_instance.id}/question_sets/{self.author_qset.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("id", response.data)


class TestInstanceLock(WidgetInstanceViewSetTestCase):
    """Tests for GET /api/instances/{id}/lock/"""

    def test_unauthenticated_returns_403(self):
        response = self.client.get(f"/api/instances/{self.author_instance.id}/lock/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch(
        "api.views.widget_instances.WidgetInstanceService.get_lock",
        return_value=True,
    )
    def test_owner_can_get_lock(self, mock_get_lock):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.get(f"/api/instances/{self.author_instance.id}/lock/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("lock_obtained", response.data)
        self.assertTrue(response.data["lock_obtained"])

    @patch(
        "api.views.widget_instances.WidgetInstanceService.get_lock",
        return_value=False,
    )
    def test_lock_returns_false_when_locked_by_another(self, mock_get_lock):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.get(f"/api/instances/{self.author_instance.id}/lock/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["lock_obtained"])


class TestInstancePerformance(WidgetInstanceViewSetTestCase):
    """Tests for GET /api/instances/{id}/performance/"""

    def test_unauthenticated_on_non_guest_returns_403(self):
        response = self.client.get(
            f"/api/instances/{self.author_instance.id}/performance/"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_on_guest_instance_allowed(self):
        response = self.client.get(
            f"/api/instances/{self.guest_instance.id}/performance/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_authenticated_can_get_performance(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(
            f"/api/instances/{self.author_instance.id}/performance/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)


class TestInstancePerms(WidgetInstanceViewSetTestCase):
    """Tests for GET/PUT /api/instances/{id}/perms/"""

    def test_unauthenticated_returns_403(self):
        response = self.client.get(f"/api/instances/{self.author_instance.id}/perms/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_can_get_perms(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(f"/api/instances/{self.shared_instance.id}/perms/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_owner_can_get_perms(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.get(f"/api/instances/{self.author_instance.id}/perms/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_owner_can_add_perms(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.put(
            f"/api/instances/{self.author_instance.id}/perms/",
            {
                "updates": [
                    {
                        "user": self.author_user.id,
                        "perm_level": ObjectPermission.PERMISSION_FULL,
                        "expiration": None,
                        "has_contexts": False,
                    },
                    {
                        "user": self.another_author.id,
                        "perm_level": ObjectPermission.PERMISSION_VISIBLE,
                        "expiration": None,
                        "has_contexts": False,
                    },
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_visible_user_cannot_grant_full_perms(self):
        """User with VISIBLE perm cannot grant FULL perms to others"""
        self.client.force_authenticate(user=self.another_author)
        response = self.client.put(
            f"/api/instances/{self.shared_instance.id}/perms/",
            {
                "updates": [
                    {
                        "user": self.another_author.id,
                        "perm_level": ObjectPermission.PERMISSION_VISIBLE,
                        "expiration": None,
                        "has_contexts": False,
                    },
                    {
                        "user": self.regular_user.id,
                        "perm_level": ObjectPermission.PERMISSION_FULL,
                        "expiration": None,
                        "has_contexts": False,
                    },
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Could not update", str(response.content))

    def test_cannot_remove_all_full_perms(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.put(
            f"/api/instances/{self.author_instance.id}/perms/",
            {
                "updates": [
                    {
                        "user": self.author_user.id,
                        "perm_level": None,
                        "expiration": None,
                        "has_contexts": False,
                    }
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn(
            "Cannot remove permissions from the only full permission holder",
            str(response.content),
        )

    def test_superuser_can_modify_any_perms(self):
        self.client.force_authenticate(user=self.superuser)
        response = self.client.put(
            f"/api/instances/{self.author_instance.id}/perms/",
            {
                "updates": [
                    {
                        "user": self.another_author.id,
                        "perm_level": ObjectPermission.PERMISSION_FULL,
                        "expiration": None,
                        "has_contexts": False,
                    }
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_user_with_no_perms_cannot_put(self):
        """Ensures user with no permissions gets MsgNoPerm error"""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.put(
            f"/api/instances/{self.another_author_instance.id}/perms/",
            {
                "updates": [
                    {
                        "user": self.regular_user.id,
                        "perm_level": ObjectPermission.PERMISSION_VISIBLE,
                        "expiration": None,
                        "has_contexts": False,
                    }
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("You do not have permission", str(response.content))

    def test_user_with_provisional_perm_can_put(self):
        """Ensures user with only provisional (context-specific) perm can update"""
        # Create provisional perm (has context_id)
        ObjectPermission.objects.create(
            user=self.another_author,
            content_object=self.author_instance,
            permission=ObjectPermission.PERMISSION_VISIBLE,
            context_id="test-context-123",
        )

        self.client.force_authenticate(user=self.another_author)
        response = self.client.put(
            f"/api/instances/{self.author_instance.id}/perms/",
            {
                "updates": [
                    {
                        "user": self.another_author.id,
                        "perm_level": ObjectPermission.PERMISSION_VISIBLE,
                        "expiration": None,
                        "has_contexts": False,
                    }
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_perm_user_already_has_no_perms_skips(self):
        """Ensures deleting perms for user with no perms is silently skipped"""
        self.client.force_authenticate(user=self.author_user)
        response = self.client.put(
            f"/api/instances/{self.author_instance.id}/perms/",
            {
                "updates": [
                    {
                        "user": self.author_user.id,
                        "perm_level": ObjectPermission.PERMISSION_FULL,
                        "expiration": None,
                        "has_contexts": False,
                    },
                    {
                        "user": self.regular_user.id,
                        "perm_level": None,
                        "expiration": None,
                        "has_contexts": False,
                    },
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_visible_user_cannot_delete_others_perms(self):
        """Ensures user with VISIBLE perm cannot delete other users' perms"""
        # another_author has VISIBLE on shared_instance
        self.client.force_authenticate(user=self.another_author)
        response = self.client.put(
            f"/api/instances/{self.shared_instance.id}/perms/",
            {
                "updates": [
                    {
                        "user": self.another_author.id,
                        "perm_level": ObjectPermission.PERMISSION_VISIBLE,
                        "expiration": None,
                        "has_contexts": False,
                    },
                    {
                        "user": self.author_user.id,
                        "perm_level": None,
                        "expiration": None,
                        "has_contexts": False,
                    },
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Could not update", str(response.content))

    def test_cannot_delete_perms_of_user_with_higher_perm(self):
        """Ensures requester cannot remove perms from user with higher perm level"""
        # Give another_author VISIBLE perm
        ObjectPermission.objects.create(
            user=self.another_author,
            content_object=self.author_instance,
            permission=ObjectPermission.PERMISSION_VISIBLE,
        )

        self.client.force_authenticate(user=self.another_author)
        response = self.client.put(
            f"/api/instances/{self.author_instance.id}/perms/",
            {
                "updates": [
                    {
                        "user": self.another_author.id,
                        "perm_level": ObjectPermission.PERMISSION_VISIBLE,
                        "expiration": None,
                        "has_contexts": False,
                    },
                    {
                        "user": self.author_user.id,  # Has FULL perm
                        "perm_level": None,
                        "expiration": None,
                        "has_contexts": False,
                    },
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Could not update", str(response.content))

    def test_cannot_modify_perms_of_user_with_higher_perm(self):
        """Ensures requester cannot modify perms of user with higher perm level"""
        # Give another_author VISIBLE perm
        ObjectPermission.objects.create(
            user=self.another_author,
            content_object=self.author_instance,
            permission=ObjectPermission.PERMISSION_VISIBLE,
        )

        self.client.force_authenticate(user=self.another_author)
        response = self.client.put(
            f"/api/instances/{self.author_instance.id}/perms/",
            {
                "updates": [
                    {
                        "user": self.another_author.id,
                        "perm_level": ObjectPermission.PERMISSION_VISIBLE,
                        "expiration": None,
                        "has_contexts": False,
                    },
                    {
                        "user": self.author_user.id,  # Has FULL perm
                        "perm_level": ObjectPermission.PERMISSION_VISIBLE,
                        "expiration": None,
                        "has_contexts": False,
                    },
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Could not update", str(response.content))

    def test_cannot_lower_own_perm(self):
        """Ensures non-superuser cannot lower their own permission level"""
        # First give another user FULL perm so we pass the "must have full perm holder" check
        ObjectPermission.objects.create(
            user=self.another_author,
            content_object=self.author_instance,
            permission=ObjectPermission.PERMISSION_FULL,
        )

        self.client.force_authenticate(user=self.author_user)
        response = self.client.put(
            f"/api/instances/{self.author_instance.id}/perms/",
            {
                "updates": [
                    {
                        "user": self.another_author.id,
                        "perm_level": ObjectPermission.PERMISSION_FULL,
                        "expiration": None,
                        "has_contexts": False,
                    },
                    {
                        "user": self.author_user.id,
                        "perm_level": ObjectPermission.PERMISSION_VISIBLE,
                        "expiration": None,
                        "has_contexts": False,
                    },
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Could not update", str(response.content))

    def test_cannot_share_with_student_on_non_guest_instance(self):
        """Ensures students cannot receive perms on non-guest instances"""
        self.client.force_authenticate(user=self.author_user)
        response = self.client.put(
            f"/api/instances/{self.author_instance.id}/perms/",
            {
                "updates": [
                    {
                        "user": self.author_user.id,
                        "perm_level": ObjectPermission.PERMISSION_FULL,
                        "expiration": None,
                        "has_contexts": False,
                    },
                    {
                        "user": self.regular_user.id,
                        "perm_level": ObjectPermission.PERMISSION_VISIBLE,
                        "expiration": None,
                        "has_contexts": False,
                    },
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Could not update", str(response.content))

    def test_can_share_with_student_on_guest_instance(self):
        """Ensures students can receive perms on guest instances"""
        self.client.force_authenticate(user=self.author_user)
        response = self.client.put(
            f"/api/instances/{self.guest_instance.id}/perms/",
            {
                "updates": [
                    {
                        "user": self.author_user.id,
                        "perm_level": ObjectPermission.PERMISSION_FULL,
                        "expiration": None,
                        "has_contexts": False,
                    },
                    {
                        "user": self.regular_user.id,
                        "perm_level": ObjectPermission.PERMISSION_VISIBLE,
                        "expiration": None,
                        "has_contexts": False,
                    },
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_provisional_perm_cannot_have_expiration(self):
        """Ensures provisional (context-specific) perms cannot have expiration"""
        expiration = (timezone.now() + timezone.timedelta(days=30)).isoformat()

        self.client.force_authenticate(user=self.author_user)
        response = self.client.put(
            f"/api/instances/{self.author_instance.id}/perms/",
            {
                "updates": [
                    {
                        "user": self.author_user.id,
                        "perm_level": ObjectPermission.PERMISSION_FULL,
                        "expiration": None,
                        "has_contexts": False,
                    },
                    {
                        "user": self.another_author.id,
                        "perm_level": ObjectPermission.PERMISSION_VISIBLE,
                        "expiration": expiration,
                        "has_contexts": True,
                    },
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Could not update", str(response.content))

    def test_provisional_perm_cannot_be_higher_than_visible(self):
        """Ensures provisional perms cannot be higher than VISIBLE"""
        self.client.force_authenticate(user=self.author_user)
        response = self.client.put(
            f"/api/instances/{self.author_instance.id}/perms/",
            {
                "updates": [
                    {
                        "user": self.author_user.id,
                        "perm_level": ObjectPermission.PERMISSION_FULL,
                        "expiration": None,
                        "has_contexts": False,
                    },
                    {
                        "user": self.another_author.id,
                        "perm_level": ObjectPermission.PERMISSION_FULL,
                        "expiration": None,
                        "has_contexts": True,
                    },
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Could not update", str(response.content))


class TestInstanceCopy(WidgetInstanceViewSetTestCase):
    """Tests for PUT /api/instances/{id}/copy/"""

    def test_unauthenticated_returns_403(self):
        response = self.client.put(
            f"/api/instances/{self.author_instance.id}/copy/",
            {"new_name": "Copied Instance"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_copy(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.put(
            f"/api/instances/{self.author_instance.id}/copy/",
            {"new_name": "Copied Instance", "copy_existing_perms": False},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Copied Instance")
        self.assertNotEqual(response.data["id"], self.author_instance.id)

    def test_non_owner_without_full_perms_cannot_copy(self):
        self.client.force_authenticate(user=self.another_author)
        response = self.client.put(
            f"/api/instances/{self.author_instance.id}/copy/",
            {"new_name": "Copied Instance"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_superuser_can_copy_any(self):
        self.client.force_authenticate(user=self.superuser)
        response = self.client.put(
            f"/api/instances/{self.author_instance.id}/copy/",
            {"new_name": "Superuser Copy", "copy_existing_perms": False},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_copy_sets_new_owner(self):
        """Copied instance should have the copier as owner"""
        self.client.force_authenticate(user=self.author_user)
        response = self.client.put(
            f"/api/instances/{self.author_instance.id}/copy/",
            {"new_name": "My Copy", "copy_existing_perms": False},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            WidgetInstance.objects.get(id=response.data["id"]).user_id,
            self.author_user.id,
        )

    def test_copy_missing_new_name_returns_400(self):
        """Copying without new_name should fail"""
        self.client.force_authenticate(user=self.author_user)
        response = self.client.put(
            f"/api/instances/{self.author_instance.id}/copy/",
            {"copy_existing_perms": False},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_copy_creates_new_id(self):
        """Copied instance should have a different ID"""
        self.client.force_authenticate(user=self.author_user)
        response = self.client.put(
            f"/api/instances/{self.author_instance.id}/copy/",
            {"new_name": "Different ID Copy", "copy_existing_perms": False},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotEqual(response.data["id"], self.author_instance.id)

    def test_copy_copies_draft(self):
        """Copied instance should not be a draft"""
        self.client.force_authenticate(user=self.author_user)
        response = self.client.put(
            f"/api/instances/{self.author_instance.id}/copy/",
            {"new_name": "Draft Copy", "copy_existing_perms": False},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["is_draft"], self.author_instance.is_draft)

    def test_support_user_can_copy_any(self):
        """Support user can copy any instance"""
        self.client.force_authenticate(user=self.support_user)
        response = self.client.put(
            f"/api/instances/{self.author_instance.id}/copy/",
            {"new_name": "Support Copy", "copy_existing_perms": False},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_copy_with_perms_copies_permissions(self):
        """Copying with copy_existing_perms should copy permissions"""
        self.client.force_authenticate(user=self.author_user)
        response = self.client.put(
            f"/api/instances/{self.author_instance.id}/copy/",
            {"new_name": "Perms Copy", "copy_existing_perms": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        new_instance = WidgetInstance.objects.get(id=response.data["id"])
        self.assertEqual(response.data["is_draft"], self.author_instance.is_draft)
        # Should have permissions copied from original
        self.assertTrue(new_instance.permissions.exists())


class TestInstanceExportPlaydata(WidgetInstanceViewSetTestCase):
    """Tests for GET /api/instances/{id}/export_playdata/"""

    def setUp(self):
        super().setUp()
        cache.clear()

    def test_unauthenticated_returns_403(self):
        response = self.client.get(
            f"/api/instances/{self.author_instance.id}/export_playdata/",
            {
                "type": "High Scores",
                "semesters": f"{self.semester.year}-{self.semester.semester}",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_export(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.get(
            f"/api/instances/{self.author_instance.id}/export_playdata/",
            {
                "type": "High Scores",
                "semesters": f"{self.semester.year}-{self.semester.semester}",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_user_with_visible_perms_can_export(self):
        # Give another_author VISIBLE permission on author_instance which has play logs
        ObjectPermission.objects.create(
            user=self.another_author,
            content_object=self.author_instance,
            permission=ObjectPermission.PERMISSION_VISIBLE,
        )
        self.client.force_authenticate(user=self.another_author)
        response = self.client.get(
            f"/api/instances/{self.author_instance.id}/export_playdata/",
            {
                "type": "High Scores",
                "semesters": f"{self.semester.year}-{self.semester.semester}",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_non_owner_without_perms_cannot_export(self):
        """User without permissions cannot export"""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(
            f"/api/instances/{self.another_author_instance.id}/export_playdata/",
            {
                "type": "High Scores",
                "semesters": f"{self.semester.year}-{self.semester.semester}",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_export_requires_type_param(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.get(
            f"/api/instances/{self.author_instance.id}/export_playdata/"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Missing export_type query parameter", str(response.content))

    def test_export_with_semester_filter(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.get(
            f"/api/instances/{self.author_instance.id}/export_playdata/",
            {
                "type": "High Scores",
                "semesters": f"{self.semester.year}-{self.semester.semester}",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_export_returns_file_response(self):
        """Export should return a downloadable file"""
        self.client.force_authenticate(user=self.author_user)
        response = self.client.get(
            f"/api/instances/{self.author_instance.id}/export_playdata/",
            {
                "type": "High Scores",
                "semesters": f"{self.semester.year}-{self.semester.semester}",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Content-Disposition", response)


class TestInstanceUndelete(WidgetInstanceViewSetTestCase):
    """Tests for POST /api/instances/{id}/undelete/"""

    def test_unauthenticated_returns_403(self):
        response = self.client.post(
            f"/api/instances/{self.deleted_instance.id}/undelete/"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_regular_user_cannot_undelete(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            f"/api/instances/{self.deleted_instance.id}/undelete/"
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_cannot_undelete(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.post(
            f"/api/instances/{self.deleted_instance.id}/undelete/"
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_support_user_can_undelete(self):
        self.client.force_authenticate(user=self.support_user)
        response = self.client.post(
            f"/api/instances/{self.deleted_instance.id}/undelete/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.deleted_instance.refresh_from_db()
        self.assertFalse(self.deleted_instance.is_deleted)

    def test_superuser_can_undelete(self):
        deleted = WidgetInstance.objects.create(
            id="undel001",
            widget=self.widget,
            user=self.author_user,
            name="To Undelete",
            is_deleted=True,
        )

        self.client.force_authenticate(user=self.superuser)
        response = self.client.post(f"/api/instances/{deleted.id}/undelete/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        deleted.refresh_from_db()
        self.assertFalse(deleted.is_deleted)

    def test_undelete_not_deleted_instance(self):
        self.client.force_authenticate(user=self.superuser)
        response = self.client.post(
            f"/api/instances/{self.author_instance.id}/undelete/"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Instance is not deleted", str(response.content))

    def test_undelete_nonexistent_instance(self):
        """Undeleting a nonexistent instance should fail"""
        self.client.force_authenticate(user=self.superuser)
        response = self.client.post("/api/instances/1/undelete/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
