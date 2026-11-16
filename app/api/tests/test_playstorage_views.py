import base64
import json
from datetime import datetime, timedelta
from datetime import timezone as datetime_timezone

import phpserialize
from api.tests.base import MateriaTestCase
from core.models import (
    DateRange,
    LogPlay,
    LogStorage,
    ObjectPermission,
    Widget,
    WidgetInstance,
    WidgetQset,
)
from django.contrib.auth.models import User
from django.db import transaction
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient


class PlayStorageViewSetTestCase(MateriaTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.author = User.objects.create_user(username="storage_author")
        cls.player = User.objects.create_user(
            username="storage_player", first_name="Test", last_name="Player"
        )
        cls.other = User.objects.create_user(username="storage_other")
        cls.viewer = User.objects.create_user(username="storage_viewer")
        cls.expired_user = User.objects.create_user(username="storage_expired")
        cls.superuser = User.objects.create_superuser(
            username="storage_admin", email="admin@example.com", password="testpass"
        )
        cls.support = User.objects.create_user(username="storage_support")
        cls.support.groups.add(cls.support_group)
        cls.widget = Widget.objects.create(
            name="Storage widget", clean_name="storage-widget", is_storage_enabled=True
        )
        cls.disabled_widget = Widget.objects.create(
            name="No storage", clean_name="no-storage", is_storage_enabled=False
        )
        cls.instance = WidgetInstance.objects.create(
            id="storage1",
            widget=cls.widget,
            user=cls.author,
            name="Storage",
            is_draft=False,
            guest_access=False,
        )
        cls.unrelated_instance = WidgetInstance.objects.create(
            id="storage2",
            widget=cls.widget,
            user=cls.other,
            name="Other storage",
            is_draft=False,
            guest_access=False,
        )
        cls.guest_instance = WidgetInstance.objects.create(
            id="storage3",
            widget=cls.widget,
            user=cls.author,
            name="Guest storage",
            is_draft=False,
            guest_access=True,
        )
        cls.disabled_instance = WidgetInstance.objects.create(
            id="storage4",
            widget=cls.disabled_widget,
            user=cls.author,
            name="Disabled",
            is_draft=False,
            guest_access=False,
        )
        for instance in (cls.instance, cls.guest_instance, cls.disabled_instance):
            instance.permissions.create(
                user=cls.author, permission=ObjectPermission.PERMISSION_FULL
            )
        cls.instance.permissions.create(
            user=cls.viewer,
            permission=ObjectPermission.PERMISSION_VISIBLE,
            expires_at=timezone.now() + timedelta(days=1),
        )
        cls.instance.permissions.create(
            user=cls.expired_user,
            permission=ObjectPermission.PERMISSION_FULL,
            expires_at=timezone.now() - timedelta(days=1),
        )
        cls.semester = DateRange.objects.get(semester="fall", year=2024)
        cls.play = cls.make_play("storage-play1", cls.instance, cls.player)
        cls.other_play = cls.make_play("storage-play2", cls.instance, cls.other)
        cls.unrelated_play = cls.make_play(
            "storage-play3", cls.unrelated_instance, cls.other
        )
        cls.guest_play = cls.make_play("storage-play4", cls.guest_instance, None)
        cls.authenticated_guest_play = cls.make_play(
            "storage-play5", cls.guest_instance, cls.player
        )
        cls.disabled_play = cls.make_play(
            "storage-play6", cls.disabled_instance, cls.player
        )
        cls.fall_time = datetime(2024, 10, 15, 12, tzinfo=datetime_timezone.utc)
        cls.spring_time = datetime(2024, 3, 15, 12, tzinfo=datetime_timezone.utc)
        cls.next_year_time = datetime(2025, 10, 15, 12, tzinfo=datetime_timezone.utc)
        cls.json_log = cls.make_log(
            cls.play, "answers", {"z": 2, "a": "first"}, cls.fall_time
        )
        cls.php_log = cls.make_log(
            cls.play, "answers", {"z": 3, "a": "legacy"}, cls.spring_time, legacy=True
        )
        cls.other_log = cls.make_log(
            cls.other_play, "events", {"event": "other"}, cls.next_year_time
        )
        cls.unrelated_log = cls.make_log(
            cls.unrelated_play, "private", {"secret": "excluded"}, cls.fall_time
        )
        cls.guest_log = cls.make_log(
            cls.guest_play, "answers", {"answer": "guest"}, cls.fall_time
        )

    @classmethod
    def make_play(cls, play_id, instance, user):
        qset = WidgetQset.objects.create(instance=instance, data="e30=", version="1")
        return LogPlay.objects.create(
            id=play_id,
            instance=instance,
            user=user,
            qset=qset,
            semester=cls.semester,
            is_valid=True,
            is_complete=False,
            score=0,
            score_possible=100,
            percent=0,
            elapsed=0,
            ip="127.0.0.1",
            auth="",
            referrer_url="",
            context_id="",
        )

    @staticmethod
    def make_log(play, name, data, created_at, legacy=False):
        raw = phpserialize.dumps(data) if legacy else json.dumps(data).encode("utf-8")
        return LogStorage.objects.create(
            instance=play.instance,
            play_log=play,
            user=play.user,
            name=name,
            data=base64.b64encode(raw).decode("ascii"),
            created_at=created_at,
        )

    def setUp(self):
        self.client = APIClient()

    def assert_table_row(self, row, log, data):
        self.assertEqual(row["data"], data)
        self.assertEqual(list(row["data"]), sorted(data))
        self.assertEqual(set(row), {"play", "data"})
        expected_user = log.user
        self.assertEqual(
            row["play"],
            {
                "user": expected_user.username if expected_user else "Guest",
                "firstName": expected_user.first_name if expected_user else "",
                "lastName": expected_user.last_name if expected_user else "",
                "time": log.created_at,
                "cleanTime": log.created_at.strftime("%m/%d/%Y %H:%M:%S %Z"),
                "play_id": log.play_log_id,
            },
        )


class TestPlayStorageList(PlayStorageViewSetTestCase):
    def test_list_by_instance_returns_only_its_grouped_rows(self):
        for user in (self.author, self.viewer):
            with self.subTest(user=user.username):
                self.client.force_authenticate(user=user)
                response = self.client.get(
                    "/api/storage/", {"inst_id": self.instance.id}
                )
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(set(response.data), {"answers", "events"})
                self.assertEqual(len(response.data["answers"]), 2)
                answers = {row["data"]["a"]: row for row in response.data["answers"]}
                self.assert_table_row(
                    answers["first"], self.json_log, {"a": "first", "z": 2}
                )
                self.assert_table_row(
                    answers["legacy"], self.php_log, {"a": "legacy", "z": 3}
                )
                self.assertEqual(len(response.data["events"]), 1)
                self.assert_table_row(
                    response.data["events"][0], self.other_log, {"event": "other"}
                )

    def test_list_by_play_excludes_other_plays(self):
        self.client.force_authenticate(user=self.author)
        response = self.client.get("/api/storage/", {"play_id": self.play.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(set(response.data), {"answers"})
        self.assertEqual(
            {row["data"]["a"] for row in response.data["answers"]}, {"first", "legacy"}
        )
        self.assertTrue(
            all(
                row["play"]["play_id"] == self.play.id
                for row in response.data["answers"]
            )
        )

    def test_year_and_term_filters_use_storage_timestamps(self):
        self.client.force_authenticate(user=self.author)
        for filters, expected in (
            ({"year": "2024"}, {"first", "legacy"}),
            ({"year": "2024", "term": "fall"}, {"first"}),
            ({"year": "2024", "term": "spring"}, {"legacy"}),
            ({"year": "2030"}, set()),
        ):
            with self.subTest(filters=filters):
                response = self.client.get(
                    "/api/storage/", {"inst_id": self.instance.id, **filters}
                )
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(
                    {row["data"]["a"] for row in response.data.get("answers", [])},
                    expected,
                )
                self.assertEqual(set(response.data), {"answers"} if expected else set())

    def test_authorized_instance_without_logs_returns_empty_tables(self):
        self.client.force_authenticate(user=self.author)
        response = self.client.get(
            "/api/storage/", {"inst_id": self.disabled_instance.id}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {})

    def test_anonymize_reuses_alias_and_removes_identity(self):
        self.client.force_authenticate(user=self.author)
        response = self.client.get(
            "/api/storage/", {"inst_id": self.instance.id, "anonymize": "true"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rows = [row for table in response.data.values() for row in table]
        self.assertEqual(len(rows), 3)
        aliases = {}
        for row in rows:
            play = row["play"]
            alias = play["user"]
            self.assertRegex(alias, r"^user\d+$")
            self.assertEqual(play["firstName"], "User")
            self.assertEqual(play["lastName"], alias.removeprefix("user"))
            previous = aliases.setdefault(play["play_id"], alias)
            self.assertEqual(previous, alias)
        self.assertNotEqual(aliases[self.play.id], aliases[self.other_play.id])
        for identity in (
            self.player.username,
            self.player.first_name,
            self.player.last_name,
            self.other.username,
        ):
            self.assertNotIn(identity, response.content.decode())
        self.assertEqual(
            {row["data"]["a"] for row in response.data["answers"]}, {"first", "legacy"}
        )

    def test_guest_storage_displays_guest_without_identity(self):
        self.client.force_authenticate(user=self.author)
        response = self.client.get("/api/storage/", {"inst_id": self.guest_instance.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(set(response.data), {"answers"})
        self.assertEqual(len(response.data["answers"]), 1)
        self.assert_table_row(
            response.data["answers"][0], self.guest_log, {"answer": "guest"}
        )


class TestPlayStorageRetrieve(PlayStorageViewSetTestCase):
    def test_retrieve_decodes_json_and_legacy_data(self):
        self.client.force_authenticate(user=self.viewer)
        for log, data, scope in (
            (self.json_log, {"a": "first", "z": 2}, {"inst_id": self.instance.id}),
            (self.php_log, {"a": "legacy", "z": 3}, {"play_id": self.play.id}),
        ):
            with self.subTest(log=log.id):
                response = self.client.get(f"/api/storage/{log.id}/", scope)
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(response.data["id"], log.id)
                self.assertEqual(response.data["instance"], log.instance_id)
                self.assertEqual(response.data["play_log"], log.play_log_id)
                self.assertEqual(response.data["user"], log.user_id)
                self.assertEqual(response.data["name"], log.name)
                self.assertEqual(response.data["data"], data)
                self.assertEqual(list(response.data["data"]), sorted(data))
                self.assertIn("created_at", response.data)

    def test_missing_or_out_of_scope_record_returns_404(self):
        self.client.force_authenticate(user=self.author)
        for log_id, scope in (
            (999999, {"inst_id": self.instance.id}),
            (self.unrelated_log.id, {"inst_id": self.instance.id}),
            (self.other_log.id, {"play_id": self.play.id}),
        ):
            with self.subTest(log_id=log_id, scope=scope):
                response = self.client.get(f"/api/storage/{log_id}/", scope)
                self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class TestPlayStorageReadPermissions(PlayStorageViewSetTestCase):
    def test_anonymous_cannot_read_private_or_guest_storage(self):
        for instance, play, log in (
            (self.instance, self.play, self.json_log),
            (self.guest_instance, self.guest_play, self.guest_log),
        ):
            for scope in ({"inst_id": instance.id}, {"play_id": play.id}):
                for url in ("/api/storage/", f"/api/storage/{log.id}/"):
                    with self.subTest(url=url, scope=scope):
                        response = self.client.get(url, scope)
                        self.assertEqual(
                            response.status_code, status.HTTP_403_FORBIDDEN
                        )

    def test_play_ownership_unrelated_and_expired_users_cannot_read(self):
        for user in (self.player, self.other, self.expired_user):
            self.client.force_authenticate(user=user)
            for scope in ({"inst_id": self.instance.id}, {"play_id": self.play.id}):
                for url in ("/api/storage/", f"/api/storage/{self.json_log.id}/"):
                    with self.subTest(user=user.username, url=url, scope=scope):
                        response = self.client.get(url, scope)
                        self.assertEqual(
                            response.status_code, status.HTTP_403_FORBIDDEN
                        )

    def test_missing_and_unknown_scope_is_denied(self):
        self.client.force_authenticate(user=self.author)
        for scope in ({}, {"inst_id": "missing"}, {"play_id": "missing"}):
            for url in ("/api/storage/", f"/api/storage/{self.json_log.id}/"):
                with self.subTest(url=url, scope=scope):
                    response = self.client.get(url, scope)
                    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_elevated_roles_require_explicit_instance_permissions(self):
        for user in (self.superuser, self.support):
            with self.subTest(user=user.username):
                self.client.force_authenticate(user=user)
                response = self.client.get(
                    "/api/storage/", {"inst_id": self.instance.id}
                )
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
                self.instance.permissions.create(
                    user=user, permission=ObjectPermission.PERMISSION_VISIBLE
                )
                response = self.client.get("/api/storage/", {"play_id": self.play.id})
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(len(response.data["answers"]), 2)


class TestPlayStorageScopePrecedence(PlayStorageViewSetTestCase):
    def test_authorized_play_ignores_instance_parameter(self):
        self.client.force_authenticate(user=self.author)
        for instance_id in (
            self.instance.id,
            self.unrelated_instance.id,
            "missing",
            "",
        ):
            scope = {"play_id": self.play.id, "inst_id": instance_id}
            with self.subTest(instance_id=instance_id):
                response = self.client.get("/api/storage/", scope)
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(set(response.data), {"answers"})
                self.assertEqual(len(response.data["answers"]), 2)
                self.assertTrue(
                    all(
                        row["play"]["play_id"] == self.play.id
                        for row in response.data["answers"]
                    )
                )
                response = self.client.get(f"/api/storage/{self.json_log.id}/", scope)
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(response.data["id"], self.json_log.id)
                self.assertEqual(response.data["instance"], self.instance.id)
                self.assertEqual(response.data["play_log"], self.play.id)

    def test_unauthorized_play_cannot_borrow_instance_permission(self):
        self.client.force_authenticate(user=self.author)
        scope = {"play_id": self.unrelated_play.id, "inst_id": self.instance.id}
        for url in ("/api/storage/", f"/api/storage/{self.unrelated_log.id}/"):
            with self.subTest(url=url):
                response = self.client.get(url, scope)
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_empty_and_unknown_play_do_not_fall_back_to_instance(self):
        self.client.force_authenticate(user=self.author)
        for play_id in ("", "missing"):
            for url in ("/api/storage/", f"/api/storage/{self.json_log.id}/"):
                with self.subTest(play_id=play_id, url=url):
                    response = self.client.get(
                        url, {"play_id": play_id, "inst_id": self.instance.id}
                    )
                    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


@override_settings(DEBUG_PROPAGATE_EXCEPTIONS=True)
class TestPlayStoragePacketValidation(PlayStorageViewSetTestCase):
    def setUp(self):
        super().setUp()
        self.client.force_authenticate(user=self.player)

    def assert_invalid_logs(self, logs, field=None):
        before = list(LogStorage.objects.values())
        with transaction.atomic():
            response = self.client.post(
                "/api/storage/", {"play_id": self.play.id, "logs": logs}, format="json"
            )
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            errors = response.json()["msg"]["logs"]
            if field is not None:
                self.assertIn(field, errors["0"])
            self.assertEqual(list(LogStorage.objects.values()), before)

    def test_logs_must_be_an_array_of_objects(self):
        for logs in (None, 1, "invalid", {}, [None], [1], ["invalid"], [[]]):
            with self.subTest(logs=logs):
                self.assert_invalid_logs(logs)

    def test_packet_name_is_required_nonblank_and_bounded(self):
        for fields in (
            {},
            {"name": None},
            {"name": ""},
            {"name": " \t "},
            {"name": "x" * 65},
            {"name": []},
            {"name": {}},
        ):
            with self.subTest(fields=fields):
                self.assert_invalid_logs(
                    [{"data": {"answer": 1}, **fields}], field="name"
                )

    def test_packet_data_is_required_and_object_shaped(self):
        for fields in (
            {},
            {"data": None},
            {"data": []},
            {"data": "invalid"},
            {"data": 1},
            {"data": True},
        ):
            with self.subTest(fields=fields):
                self.assert_invalid_logs([{"name": "answers", **fields}], field="data")

    def test_invalid_packet_rejects_entire_batch(self):
        before = list(LogStorage.objects.values())
        response = self.client.post(
            "/api/storage/",
            {
                "play_id": self.play.id,
                "logs": [
                    {"name": "answers", "data": {"answer": "valid"}},
                    {"name": "answers"},
                ],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("data", response.json()["msg"]["logs"]["1"])
        self.assertEqual(list(LogStorage.objects.values()), before)

    def test_boundary_name_and_empty_data_round_trip_without_normalization(self):
        for name in ("x" * 64, "  answers  "):
            with self.subTest(name=name):
                previous_ids = list(LogStorage.objects.values_list("id", flat=True))
                response = self.client.post(
                    "/api/storage/",
                    {"play_id": self.play.id, "logs": [{"name": name, "data": {}}]},
                    format="json",
                )
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertIs(response.data, True)
                log = LogStorage.objects.exclude(id__in=previous_ids).get()
                self.assertEqual(log.name, name)
                self.assertEqual(json.loads(base64.b64decode(log.data)), {})
                self.client.force_authenticate(user=self.author)
                response = self.client.get(
                    f"/api/storage/{log.id}/", {"play_id": self.play.id}
                )
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(response.data["name"], name)
                self.assertEqual(response.data["data"], {})
                self.client.force_authenticate(user=self.player)


class TestPlayStorageCreate(PlayStorageViewSetTestCase):
    def test_owned_play_saves_single_and_multiple_packets(self):
        self.client.force_authenticate(user=self.player)
        packets = [
            {
                "name": "answers",
                "data": {"answer": "caf\u00e9", "points": 2, "optional": None},
            },
            {"name": "events", "data": {"nested": {"values": [True, None, 3]}}},
        ]
        for logs in (packets[:1], packets):
            with self.subTest(packet_count=len(logs)):
                previous_ids = list(LogStorage.objects.values_list("id", flat=True))
                response = self.client.post(
                    "/api/storage/",
                    {"play_id": self.play.id, "logs": logs},
                    format="json",
                )
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertIs(response.data, True)
                created = list(
                    LogStorage.objects.exclude(id__in=previous_ids).order_by("id")
                )
                self.assertEqual(len(created), len(logs))
                for log, packet in zip(created, logs):
                    self.assertEqual(log.instance_id, self.instance.id)
                    self.assertEqual(log.play_log_id, self.play.id)
                    self.assertEqual(log.user_id, self.player.id)
                    self.assertEqual(log.name, packet["name"])
                    self.assertEqual(
                        json.loads(base64.b64decode(log.data)), packet["data"]
                    )

    def test_empty_logs_succeeds_without_writes(self):
        self.client.force_authenticate(user=self.player)
        before = list(LogStorage.objects.values())
        response = self.client.post(
            "/api/storage/", {"play_id": self.play.id, "logs": []}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIs(response.data, True)
        self.assertEqual(list(LogStorage.objects.values()), before)

    def test_authenticated_guest_instance_save_has_null_user(self):
        self.client.force_authenticate(user=self.player)
        previous_ids = list(LogStorage.objects.values_list("id", flat=True))
        response = self.client.post(
            "/api/storage/",
            {
                "play_id": self.authenticated_guest_play.id,
                "logs": [{"name": "answers", "data": {"answer": "guest"}}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIs(response.data, True)
        log = LogStorage.objects.exclude(id__in=previous_ids).get()
        self.assertIsNone(log.user_id)
        self.assertEqual(log.instance_id, self.guest_instance.id)
        self.assertEqual(log.play_log_id, self.authenticated_guest_play.id)
        self.assertEqual(log.name, "answers")
        self.assertEqual(json.loads(base64.b64decode(log.data)), {"answer": "guest"})

    def test_missing_logs_returns_400_without_writes(self):
        self.client.force_authenticate(user=self.player)
        before = list(LogStorage.objects.values())
        response = self.client.post(
            "/api/storage/", {"play_id": self.play.id}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("logs", response.json()["msg"])
        self.assertEqual(list(LogStorage.objects.values()), before)

    def test_malformed_json_returns_400_without_writes(self):
        self.client.force_authenticate(user=self.player)
        before = list(LogStorage.objects.values())
        response = self.client.post(
            "/api/storage/", '{"play_id":', content_type="application/json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(list(LogStorage.objects.values()), before)


class TestPlayStorageDeniedWrites(PlayStorageViewSetTestCase):
    def test_anonymous_cannot_save_any_play_including_guest(self):
        for play in (self.play, self.guest_play, self.authenticated_guest_play):
            with self.subTest(play=play.id):
                before = list(LogStorage.objects.values())
                response = self.client.post(
                    "/api/storage/",
                    {
                        "play_id": play.id,
                        "logs": [{"name": "answers", "data": {"a": 1}}],
                    },
                    format="json",
                )
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
                self.assertEqual(list(LogStorage.objects.values()), before)

    def test_unowned_disabled_missing_and_unknown_play_cannot_be_saved(self):
        self.client.force_authenticate(user=self.player)
        for payload in (
            {"play_id": self.other_play.id},
            {"play_id": self.disabled_play.id},
            {"play_id": "missing"},
            {},
        ):
            with self.subTest(payload=payload):
                before = list(LogStorage.objects.values())
                response = self.client.post(
                    "/api/storage/",
                    {**payload, "logs": [{"name": "answers", "data": {"a": 1}}]},
                    format="json",
                )
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
                self.assertEqual(list(LogStorage.objects.values()), before)

    def test_instance_permissions_and_elevated_roles_do_not_allow_unowned_saves(self):
        for user in (self.author, self.viewer, self.superuser, self.support):
            with self.subTest(user=user.username):
                self.client.force_authenticate(user=user)
                before = list(LogStorage.objects.values())
                response = self.client.post(
                    "/api/storage/",
                    {
                        "play_id": self.play.id,
                        "logs": [{"name": "answers", "data": {"a": 1}}],
                    },
                    format="json",
                )
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
                self.assertEqual(list(LogStorage.objects.values()), before)

    def test_unsupported_methods_do_not_change_records(self):
        self.client.force_authenticate(user=self.author)
        for method in ("put", "patch", "delete", "head", "options"):
            with self.subTest(method=method):
                before = list(LogStorage.objects.values())
                response = getattr(self.client, method)(
                    f"/api/storage/{self.json_log.id}/", format="json"
                )
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
                self.assertEqual(list(LogStorage.objects.values()), before)

    def test_post_to_detail_is_method_not_allowed_after_permission_check(self):
        self.client.force_authenticate(user=self.player)
        before = list(LogStorage.objects.values())
        response = self.client.post(
            f"/api/storage/{self.json_log.id}/",
            {"play_id": self.play.id, "logs": [{"name": "answers", "data": {"a": 1}}]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(list(LogStorage.objects.values()), before)
