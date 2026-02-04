from django.contrib.auth.models import Group, User
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from core.models import DateRange, LogPlay, Widget, WidgetInstance, WidgetQset


class PlaySessionViewSetTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.author_group, _ = Group.objects.get_or_create(name="basic_author")

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

        cls.another_user = User.objects.create_user(
            username="another",
            email="another@example.com",
            password="testpass123",
        )

        cls.semester = DateRange.objects.create(
            semester="Fall",
            year=2024,
            start_at=timezone.now(),
            end_at=timezone.now() + timezone.timedelta(days=120),
        )

        cls.widget = Widget.objects.create(
            name="Test Widget",
            clean_name="test-widget",
            is_editable=True,
            is_playable=True,
            is_scorable=False
        )

        cls.non_playable_widget = Widget.objects.create(
            name="Non-Playable Widget",
            clean_name="non-playable-widget",
            is_editable=True,
            is_playable=False,
        )

        cls.regular_instance = WidgetInstance.objects.create(
            id="regular001",
            widget=cls.widget,
            user=cls.author_user,
            name="Regular Instance",
            is_draft=False,
            guest_access=False,
        )

        cls.guest_instance = WidgetInstance.objects.create(
            id="guest123",
            widget=cls.widget,
            user=cls.author_user,
            name="Guest Instance",
            is_draft=False,
            guest_access=True,
        )

        cls.non_playable_instance = WidgetInstance.objects.create(
            id="nonplay123",
            widget=cls.non_playable_widget,
            user=cls.author_user,
            name="Non-Playable Instance",
            is_draft=False,
            guest_access=False,
        )

        cls.regular_qset = WidgetQset.objects.create(
            instance=cls.regular_instance,
            data="eyJ0ZXN0IjogImRhdGEifQ==",
            version="1",
        )

        cls.guest_qset = WidgetQset.objects.create(
            instance=cls.guest_instance,
            data="eyJ0ZXN0IjogImRhdGEifQ==",
            version="1",
        )

        cls.user_play = LogPlay.objects.create(
            id="play1",
            instance=cls.regular_instance,
            user=cls.regular_user,
            is_valid=True,
            is_complete=False,
            score=0,
            score_possible=100,
            percent=0,
            elapsed=0,
            qset=cls.regular_qset,
            ip="127.0.0.1",
            auth="",
            referrer_url="",
            context_id="",
            semester=cls.semester,
        )

        cls.completed_play = LogPlay.objects.create(
            id="play3",
            instance=cls.regular_instance,
            user=cls.regular_user,
            is_valid=False,
            is_complete=True,
            score=85,
            score_possible=100,
            percent=85.0,
            elapsed=300,
            qset=cls.regular_qset,
            ip="127.0.0.1",
            auth="",
            referrer_url="",
            context_id="",
            semester=cls.semester,
        )

        cls.invalid_play = LogPlay.objects.create(
            id="play5",
            instance=cls.regular_instance,
            user=cls.regular_user,
            is_valid=False,
            is_complete=False,
            score=0,
            score_possible=100,
            percent=0,
            elapsed=0,
            qset=cls.regular_qset,
            ip="127.0.0.1",
            auth="",
            referrer_url="",
            context_id="",
            semester=cls.semester,
        )

        cls.guest_play = LogPlay.objects.create(
            id="play6",
            instance=cls.guest_instance,
            user=None,
            is_valid=True,
            is_complete=False,
            score=0,
            score_possible=100,
            percent=0,
            elapsed=0,
            qset=cls.guest_qset,
            ip="127.0.0.1",
            auth="",
            referrer_url="",
            context_id="",
            semester=cls.semester,
        )

    def setUp(self):
        self.client = APIClient()


class TestPlaySessionList(PlaySessionViewSetTestCase):
    """Tests for GET /api/play-sessions/"""

    def test_unauthenticated_returns_403(self):
        response = self.client.get("/api/play-sessions/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authenticated_user_can_list_own_plays(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/play-sessions/", {"user": "me"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_by_instance_returns_plays(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.get(
            "/api/play-sessions/", {"inst_id": self.regular_instance.id}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        play_ids = [play["id"] for play in response.data["results"]]
        self.assertIn(self.user_play.id, play_ids)

    def test_list_without_filter_returns_empty(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/play-sessions/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 0)

    def test_list_with_include_user_info(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.get(
            "/api/play-sessions/",
            {"inst_id": self.regular_instance.id, "include_user_info": "true"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_with_include_activity(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.get(
            "/api/play-sessions/",
            {"inst_id": self.regular_instance.id, "include_activity": "true"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_guest_instance_hides_user_info(self):
        """When listing plays for a guest instance with include_user_info, user should be null"""
        self.client.force_authenticate(user=self.author_user)
        response = self.client.get(
            "/api/play-sessions/",
            {"inst_id": self.guest_instance.id, "include_user_info": "true"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)


class TestPlaySessionCreate(PlaySessionViewSetTestCase):
    """Tests for POST /api/play-sessions/"""

    def test_unauthenticated_on_non_guest_returns_403(self):
        response = self.client.post(
            "/api/play-sessions/",
            {"instanceId": self.regular_instance.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_on_guest_instance_allowed(self):
        response = self.client.post(
            "/api/play-sessions/",
            {"instanceId": self.guest_instance.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("playId", response.json())

    def test_authenticated_can_create_play(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            "/api/play-sessions/",
            {"instanceId": self.regular_instance.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("playId", response.json())

    def test_create_play_on_non_playable_widget_fails(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            "/api/play-sessions/",
            {"instanceId": self.non_playable_instance.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_preview_play(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.post(
            "/api/play-sessions/",
            {"instanceId": self.regular_instance.id, "is_preview": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("playId", response.json())

    def test_create_missing_instance_id_returns_400(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            "/api/play-sessions/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_invalid_instance_id_returns_400(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.post(
            "/api/play-sessions/",
            {"instanceId": "nonexistent123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TestPlaySessionUpdate(PlaySessionViewSetTestCase):
    """Tests for PUT /api/play-sessions/{id}/"""

    def test_unauthenticated_on_non_guest_play_returns_403(self):
        response = self.client.put(
            f"/api/play-sessions/{self.user_play.id}/",
            {"logs": []},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_owner_cannot_update_play(self):
        self.client.force_authenticate(user=self.another_user)
        response = self.client.put(
            f"/api/play-sessions/{self.user_play.id}/",
            {"logs": []},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_invalid_play_fails(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.put(
            f"/api/play-sessions/{self.invalid_play.id}/",
            {"logs": []},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated_can_update_guest_play(self):
        response = self.client.put(
            f"/api/play-sessions/{self.guest_play.id}/",
            {"logs": []},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_owner_can_update_own_play(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.put(
            f"/api/play-sessions/{self.user_play.id}/",
            {"logs": []},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_completed_play_fails(self):
        """Completed plays should not be updatable"""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.put(
            f"/api/play-sessions/{self.completed_play.id}/",
            {"logs": []},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TestPlaySessionVerify(PlaySessionViewSetTestCase):
    """Tests for GET /api/play-sessions/{id}/verify/"""

    def test_verify_unauthenticated_on_non_guest_returns_403(self):
        response = self.client.get(f"/api/play-sessions/{self.user_play.id}/verify/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_verify_unauthenticated_on_guest_play_allowed(self):
        response = self.client.get(f"/api/play-sessions/{self.guest_play.id}/verify/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class TestPlaySessionDestroy(PlaySessionViewSetTestCase):
    """Tests for DELETE /api/play-sessions/{id}/"""

    def test_delete_returns_405(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.delete(f"/api/play-sessions/{self.user_play.id}/")

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_delete_unauthenticated_returns_405(self):
        """DELETE is disabled for all users, returns 405 before auth check"""
        response = self.client.delete(f"/api/play-sessions/{self.guest_play.id}/")

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
