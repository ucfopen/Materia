from types import SimpleNamespace
import time
from unittest.mock import Mock, patch

import jwt
from api.authentication import EmbeddedGrant, _grant_key, issue_embedded_token
from api.tests.base import MateriaTestCase
from core.models import (
    Log,
    LogPlay,
    LogStorage,
    Lti,
    LtiPlayState,
    Widget,
    WidgetInstance,
    WidgetQset,
)
from django.conf import settings
from django.contrib.auth.models import AnonymousUser, User
from django.contrib.sessions.middleware import SessionMiddleware
from django.core.cache import cache
from django.test import RequestFactory, SimpleTestCase, override_settings
from django.urls import Resolver404, resolve
from lti.views.launch import ApplicationLaunchView
from lti.exceptions import LTIAuthException
from lti_tool.models import Key, LtiDeployment, LtiRegistration
from rest_framework.test import APIClient
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied

CLAIM = "https://purl.imsglobal.org/spec/lti/claim/"


class EmbeddedCapabilityTests(SimpleTestCase):
    purposes = {
        "player",
        "course-navigation",
        "deep-link",
        "instructor-resource",
        "scores",
    }

    def grant(self, purpose="player"):
        return EmbeddedGrant(
            user_id=1,
            instance_id="embed123",
            deployment_id=1,
            launch_data={
                CLAIM + "context": {"id": "course"},
                CLAIM + "resource_link": {"id": "resource"},
            },
            purpose=purpose,
        )

    def request(self, path, method="GET", *, data=None, query=None):
        return SimpleNamespace(
            path=path,
            method=method,
            resolver_match=resolve(path),
            data={} if data is None else data,
            query_params=query or {},
        )

    def test_explicit_route_method_and_purpose_matrix(self):
        cases = (
            ("/api/embedded/context/", "GET", self.purposes, {}, {}),
            ("/api/embedded/deep-link/instances/", "GET", {"deep-link"}, {}, {}),
            ("/api/embedded/deep-link/selection/", "POST", {"deep-link"}, {}, {}),
            ("/api/embedded/scores/", "GET", {"scores"}, {}, {}),
            ("/api/embedded/scores/resubmit/", "POST", {"scores"}, {}, {}),
            ("/api/instances/embed123/", "GET", {"player", "scores"}, {}, {}),
            (
                "/api/instances/embed123/performance/",
                "GET",
                {"player", "scores"},
                {},
                {},
            ),
            ("/api/instances/embed123/question_sets/", "GET", {"player"}, {}, {}),
            ("/api/site-messages/", "GET", {"player"}, {}, {}),
            ("/api/embedded/play/", "POST", {"player"}, {"instanceId": "embed123"}, {}),
            (
                "/api/scores/",
                "GET",
                {"player"},
                {},
                {"inst_id": "embed123", "user": "1", "context": "course"},
            ),
            ("/api/play-sessions/play/", "PUT", {"player"}, {}, {}),
            ("/api/play-sessions/play/verify/", "GET", {"player"}, {}, {}),
            ("/api/play-sessions/play/resubmit/", "POST", {"player"}, {}, {}),
            ("/api/scores/details/", "GET", {"player"}, {}, {"play_id": "play"}),
            ("/api/storage/", "POST", {"player"}, {"play_id": "play"}, {}),
            ("/api/storage/", "GET", {"player"}, {}, {"play_id": "play"}),
            ("/api/storage/", "GET", {"player"}, {}, {"inst_id": "embed123"}),
        )
        plays = Mock()
        plays.filter.return_value.exists.return_value = True
        with patch.object(EmbeddedGrant, "plays", return_value=plays):
            for path, allowed_method, purposes, data, query in cases:
                for purpose in self.purposes | {"unknown"}:
                    for method in (
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "HEAD",
                        "OPTIONS",
                    ):
                        with self.subTest(path=path, purpose=purpose, method=method):
                            request = self.request(path, method, data=data, query=query)
                            if purpose in purposes and method == allowed_method:
                                self.grant(purpose).authorize(request)
                            # Storage has both GET and POST capabilities.
                            elif (
                                path != "/api/storage/"
                                or method not in {"GET", "POST"}
                                or purpose != "player"
                            ):
                                with self.assertRaises(PermissionDenied):
                                    self.grant(purpose).authorize(request)

    def test_drfs_format_suffix_routes_are_disabled(self):
        routes = (
            ("/api/instances/", "/api/instances.json/"),
            ("/api/instances/embed123/", "/api/instances/embed123.json/"),
            (
                "/api/play-sessions/play/verify/",
                "/api/play-sessions/play/verify.json/",
            ),
        )
        for normal_path, suffixed_path in routes:
            with self.subTest(path=normal_path):
                self.assertIsNotNone(resolve(normal_path))
                with self.assertRaises(Resolver404):
                    resolve(suffixed_path)

    def test_scope_and_preview_exclusions(self):
        cases = (
            ("/api/instances/other/", "GET", {}, {}),
            ("/api/embedded/play/", "POST", {"instanceId": "other"}, {}),
            (
                "/api/scores/",
                "GET",
                {},
                {"inst_id": "embed123", "user": "2", "context": "course"},
            ),
            (
                "/api/scores/",
                "GET",
                {},
                {"inst_id": "embed123", "user": "1", "context": "other"},
            ),
            (
                "/api/scores/details/",
                "GET",
                {},
                {"play_id": "play", "preview_inst_id": ""},
            ),
            ("/api/storage/", "GET", {}, {"inst_id": "other"}),
            ("/api/users/", "GET", {}, {}),
        )
        plays = Mock()
        plays.filter.return_value.exists.return_value = True
        with patch.object(EmbeddedGrant, "plays", return_value=plays):
            for path, method, data, query in cases:
                with self.subTest(path=path, query=query):
                    with self.assertRaises(PermissionDenied):
                        self.grant().authorize(
                            self.request(path, method, data=data, query=query)
                        )
            for path, method in (
                ("/api/play-sessions/play/", "PUT"),
                ("/api/play-sessions/play/verify/", "GET"),
                ("/api/play-sessions/play/resubmit/", "POST"),
            ):
                for key in ("previewInstanceId", "previewPlayId"):
                    with self.subTest(path=path, key=key):
                        with self.assertRaises(PermissionDenied):
                            self.grant().authorize(
                                self.request(path, method, data={key: ""})
                            )
            plays.filter.return_value.exists.return_value = False
            with self.assertRaises(PermissionDenied):
                self.grant().authorize(
                    self.request("/api/scores/details/", query={"play_id": "other"})
                )

    def test_non_mapping_body_is_rejected_before_route_policy(self):
        with self.assertRaisesMessage(
            PermissionDenied, "Invalid embedded request body."
        ):
            self.grant().authorize(self.request("/api/embedded/context/", data=[]))


@override_settings(
    EMBEDDED_AUTH_ENABLED=True,
    EMBEDDED_AUTH_TOKEN_TTL=14400,
    URLS={**settings.URLS, "BASE_URL": "http://testserver/"},
    CACHES={"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}},
    LTI_USERDATA={
        "claim": None,
        "identifier": "sub",
        "ags_claim": None,
        "ags_identifier": "sub",
    },
)
class EmbeddedAuthTests(MateriaTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.user = User.objects.create_user(username="learner")
        cls.other_user = User.objects.create_user(username="other")
        cls.widget = Widget.objects.create(
            name="Test",
            clean_name="test",
            is_playable=True,
            is_scorable=False,
            score_module="Basic",
        )
        cls.instance = WidgetInstance.objects.create(
            id="embed123",
            user=cls.other_user,
            widget=cls.widget,
            name="Embedded",
            is_draft=False,
        )
        cls.guest = WidgetInstance.objects.create(
            id="guest123",
            user=cls.other_user,
            widget=cls.widget,
            name="Guest",
            is_draft=False,
            guest_access=True,
        )
        for instance in (cls.instance, cls.guest):
            WidgetQset.objects.create(instance=instance, data="e30=", version="1")
        cls.registration = LtiRegistration.objects.create(
            name="Test LMS",
            issuer="https://lms.example",
            client_id="client",
        )
        cls.deployment = LtiDeployment.objects.create(
            registration=cls.registration,
            deployment_id="deployment",
            is_active=True,
        )
        cls.association = Lti.objects.create(
            widget_instance=cls.instance,
            resource_link="resource",
            deployment=cls.deployment,
            lti_version="1.3",
        )
        cls.launch_data = {
            "sub": "123",
            "email": "learner@example.com",
            CLAIM
            + "roles": ["http://purl.imsglobal.org/vocab/lis/v2/membership#Learner"],
            CLAIM + "context": {"id": "course", "title": "Course"},
            CLAIM + "resource_link": {"id": "resource"},
            CLAIM + "deployment_id": "deployment",
            CLAIM + "target_link_uri": "http://testserver/embed/embed123/",
        }

    def setUp(self):
        cache.clear()
        self.client = APIClient(enforce_csrf_checks=True)
        self.launch = SimpleNamespace(
            deployment=self.deployment,
            get_launch_data=lambda: self.launch_data,
            get_launch_id=lambda: "launch-id",
            is_resource_launch=True,
            is_deep_link_launch=False,
        )
        self.token = issue_embedded_token(self.user, self.instance, self.launch)

    def authenticate(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def start_play(self, instance=None):
        return self.client.post(
            "/api/embedded/play/",
            {"instanceId": (instance or self.instance).pk},
            format="json",
        )

    def test_cookie_free_lti_play_preserves_context_and_ags_state(self):
        self.authenticate()
        response = self.start_play()
        self.assertEqual(response.status_code, 201)
        play = LogPlay.objects.get(pk=response.data["playId"])
        self.assertEqual(play.user, self.user)
        self.assertEqual(play.context_id, "course")
        self.assertEqual(play.auth, "lti")
        self.assertEqual(play.lti_play_state.lti_association, self.association)
        self.assertEqual(play.lti_play_state.ags_user_id, "123")
        self.assertFalse(self.client.cookies)
        verify = self.client.get(f"/api/play-sessions/{play.pk}/verify/")
        self.assertEqual(verify.status_code, 200)
        self.assertTrue(verify.data["valid"])

    def test_guest_ignores_logged_in_cookie_and_stays_anonymous(self):
        self.client.force_login(self.user)
        response = self.start_play(self.guest)
        self.assertEqual(response.status_code, 201)
        play = LogPlay.objects.get(pk=response.data["playId"])
        self.assertIsNone(play.user_id)
        self.assertEqual(play.auth, "")
        self.assertFalse(LtiPlayState.objects.filter(play=play).exists())
        self.assertIsNone(response.data["userId"])

    def test_guest_storage_is_anonymous_without_cookies_or_csrf(self):
        response = self.start_play(self.guest)
        play_id = response.data["playId"]
        response = self.client.post(
            "/api/storage/",
            {
                "play_id": play_id,
                "logs": [{"name": "answer", "data": {"value": 1}}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(LogStorage.objects.get(play_log_id=play_id).user_id)

    def test_lti_and_guest_logs_complete_and_scores_load_without_cookies(self):
        for instance in (self.instance, self.guest):
            with self.subTest(guest=instance.guest_access):
                self.client.credentials()
                if not instance.guest_access:
                    self.authenticate()
                play_id = self.start_play(instance).data["playId"]
                with patch(
                    "api.views.playsessions.AGSService.submit_score_for_play"
                ) as submit:
                    response = self.client.put(
                        f"/api/play-sessions/{play_id}/",
                        {
                            "logs": [{"type": 2, "item_id": "0", "game_time": 1}],
                        },
                        format="json",
                    )
                self.assertEqual(response.status_code, 200)
                self.assertTrue(response.data["success"])
                play = LogPlay.objects.get(pk=play_id)
                self.assertTrue(play.is_complete)
                self.assertTrue(
                    Log.objects.filter(
                        play_id=play_id, log_type=Log.LogType.WIDGET_END
                    ).exists()
                )
                self.assertEqual(submit.called, not instance.guest_access)
                response = self.client.get("/api/scores/details/", {"play_id": play_id})
                self.assertEqual(response.status_code, 200)
                self.assertTrue(response.data["overview"]["complete"])
                if instance.guest_access:
                    self.assertIsNone(play.user_id)
                else:
                    response = self.client.get(
                        "/api/scores/",
                        {
                            "inst_id": instance.pk,
                            "user": self.user.pk,
                            "context": "course",
                        },
                    )
                    self.assertEqual(response.status_code, 200)
                    self.assertEqual(
                        [score["id"] for score in response.data["scores"]], [play_id]
                    )
                self.assertEqual(self.start_play(instance).status_code, 201)
        self.assertFalse(self.client.cookies)

    def test_non_guest_requires_launch_even_with_cookie(self):
        self.client.force_login(self.user)
        self.assertEqual(self.start_play().status_code, 401)
        self.assertFalse(LogPlay.objects.exists())

    def test_invalid_bearer_does_not_fall_back_to_cookie(self):
        self.client.force_login(self.user)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalid")
        self.assertEqual(self.start_play().status_code, 401)

    def test_token_expiry_or_revocation_requires_relaunch(self):
        cache.delete(_grant_key(self.token))
        self.authenticate()
        self.assertEqual(self.start_play().status_code, 401)

    def test_token_has_fixed_cache_lifetime_and_is_not_stored_in_plaintext(self):
        with patch("api.authentication.cache.set", wraps=cache.set) as store:
            token = issue_embedded_token(self.user, self.instance, self.launch)
        key = store.call_args.args[0]
        self.assertNotIn(token, key)
        self.assertEqual(store.call_args.kwargs["timeout"], 14400)

    @override_settings(EMBEDDED_AUTH_TOKEN_TTL=10)
    def test_successful_request_does_not_extend_absolute_expiry(self):
        now = time.time()
        self.token = issue_embedded_token(self.user, self.instance, self.launch)
        self.authenticate()
        with patch("time.time", return_value=now + 5):
            self.assertEqual(self.start_play().status_code, 201)
        with patch("time.time", return_value=now + 11):
            self.assertEqual(self.start_play().status_code, 401)

    def test_disabled_deployment_or_user_rejects_token(self):
        self.authenticate()
        self.deployment.is_active = False
        self.deployment.save()
        self.assertEqual(self.start_play().status_code, 401)

    def test_inactive_registration_and_user_reject_token(self):
        self.authenticate()
        self.registration.is_active = False
        self.registration.save()
        self.assertEqual(self.start_play().status_code, 401)
        self.registration.is_active = True
        self.registration.save()
        self.user.is_active = False
        self.user.save()
        self.assertEqual(self.start_play().status_code, 401)

    def test_failed_grant_storage_does_not_report_success(self):
        from rest_framework.exceptions import AuthenticationFailed

        with patch("api.authentication.cache.get", return_value=None):
            with self.assertRaises(AuthenticationFailed):
                issue_embedded_token(self.user, self.instance, self.launch)

    def test_concurrent_course_grants_do_not_share_score_history(self):
        self.authenticate()
        play_id = self.start_play().data["playId"]
        LogPlay.objects.filter(pk=play_id).update(is_complete=True)
        other_data = {**self.launch_data, CLAIM + "context": {"id": "other-course"}}
        other_launch = SimpleNamespace(
            deployment=self.deployment,
            get_launch_data=lambda: other_data,
        )
        other_token = issue_embedded_token(self.user, self.instance, other_launch)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {other_token}")
        other_play = self.start_play().data["playId"]
        LogPlay.objects.filter(pk=other_play).update(is_complete=True)
        response = self.client.get(
            "/api/scores/",
            {
                "inst_id": self.instance.pk,
                "user": self.user.pk,
                "context": "other-course",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [score["id"] for score in response.data["scores"]], [other_play]
        )
        self.assertEqual(
            self.client.get(f"/api/play-sessions/{play_id}/verify/").status_code, 403
        )
        self.authenticate()
        self.assertEqual(
            self.client.get(f"/api/play-sessions/{play_id}/verify/").status_code, 200
        )

    def test_bearer_identity_wins_over_conflicting_cookie(self):
        self.client.force_login(self.other_user)
        self.authenticate()
        response = self.start_play()
        self.assertEqual(
            LogPlay.objects.get(pk=response.data["playId"]).user, self.user
        )

    def test_grant_cannot_access_another_instance_or_account_apis(self):
        self.authenticate()
        for path in (
            f"/api/instances/{self.guest.pk}/",
            "/api/users/",
            "/api/play-sessions/",
        ):
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 403)
        self.assertEqual(self.start_play(self.guest).status_code, 403)

    def test_grant_cannot_enter_preview_log_path_or_other_course(self):
        self.authenticate()
        play_id = self.start_play().data["playId"]
        response = self.client.put(
            f"/api/play-sessions/{play_id}/",
            {
                "previewInstanceId": self.instance.pk,
                "previewPlayId": play_id,
                "logs": [],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)
        LogPlay.objects.filter(pk=play_id).update(context_id="another-course")
        response = self.client.get(f"/api/play-sessions/{play_id}/verify/")
        self.assertEqual(response.status_code, 403)

    def test_closed_draft_deleted_and_exhausted_instances_do_not_initialize(self):
        from django.utils import timezone

        self.authenticate()
        for field, value in (
            ("close_at", timezone.now()),
            ("is_draft", True),
            ("is_deleted", True),
            ("attempts", 0),
        ):
            with self.subTest(field=field):
                previous = getattr(self.instance, field)
                setattr(self.instance, field, value)
                self.instance.save()
                self.assertIn(self.start_play().status_code, (401, 403))
                setattr(self.instance, field, previous)
                self.instance.save()
        self.assertFalse(LogPlay.objects.exists())

    def test_first_party_session_still_requires_csrf(self):
        self.client.force_login(self.user)
        response = self.client.post(
            "/api/play-sessions/", {"instanceId": self.instance.pk}, format="json"
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            self.client.get("/api/play-sessions/", {"user": "me"}).status_code, 200
        )
        from django.middleware.csrf import get_token

        request = RequestFactory().get("/")
        csrf = get_token(request)
        self.client.cookies["csrftoken"] = request.META["CSRF_COOKIE"]
        response = self.client.post(
            "/api/play-sessions/",
            {"instanceId": self.instance.pk},
            format="json",
            HTTP_X_CSRFTOKEN=csrf,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            LogPlay.objects.get(pk=response.json()["playId"]).user, self.user
        )

    @override_settings(EMBEDDED_AUTH_ENABLED=False)
    def test_feature_is_disabled_by_default_and_does_not_accept_tokens(self):
        self.assertEqual(
            self.client.get(f"/embedded/{self.instance.pk}/").status_code, 404
        )
        self.authenticate()
        self.assertEqual(self.start_play().status_code, 401)

    def test_shell_does_not_create_play(self):
        response = self.client.get(f"/embedded/{self.instance.pk}/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("no-store", response["Cache-Control"])
        self.assertEqual(response["Referrer-Policy"], "no-referrer")
        self.assertFalse(response.cookies)
        self.assertFalse(LogPlay.objects.exists())

    def test_direct_guest_embed_initializes_anonymous_play_without_launch_token(self):
        for logged_in in (False, True):
            with self.subTest(logged_in=logged_in):
                if logged_in:
                    self.client.force_login(self.user)
                response = self.client.get(f"/embed/{self.guest.pk}/")
                self.assertEqual(response.status_code, 200)
                self.assertIn("no-store", response["Cache-Control"])
                self.assertNotContains(response, "EMBEDDED_ACCESS_TOKEN")
                play = LogPlay.objects.latest("created_at")
                self.assertEqual(play.instance, self.guest)
                self.assertIsNone(play.user_id)
                self.assertEqual(play.auth, "")
                self.assertFalse(LtiPlayState.objects.filter(play=play).exists())
        self.assertEqual(LogPlay.objects.count(), 2)

    def test_validated_launch_returns_shell_without_logging_out_first_party_user(self):
        request = RequestFactory().post("/ltilaunch/")
        SessionMiddleware(lambda request: None).process_request(request)
        request.session["existing-session"] = "preserved"
        request.user = AnonymousUser()
        with (
            patch("lti.views.launch.sync_data_from_launch"),
            patch(
                "lti.views.launch.LTIAuthService.authenticate", return_value=self.user
            ) as authenticate,
        ):
            response = ApplicationLaunchView().process_validated_launch(
                request, self.launch
            )
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("Location", response)
        self.assertEqual(request.session["existing-session"], "preserved")
        authenticate.assert_called_once_with(
            request, self.launch_data, use_session=False
        )
        self.assertContains(response, "EMBEDDED_ACCESS_TOKEN")

    def test_guest_lti_launch_is_rejected_without_provisioning(self):
        launch_data = {
            **self.launch_data,
            CLAIM + "target_link_uri": "http://testserver/embed/guest123/",
        }
        self.launch.get_launch_data = lambda: launch_data
        request = RequestFactory().post("/ltilaunch/")
        request.user = AnonymousUser()
        with patch("lti.views.launch.LTIAuthService.authenticate") as authenticate:
            response = ApplicationLaunchView().get_embedded_launch_response(
                request, self.launch
            )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "error_lti_guest_mode")
        self.assertNotContains(response, "EMBEDDED_ACCESS_TOKEN")
        authenticate.assert_not_called()

    def use_grant(self, purpose, *, instance=None, play=None, data=None):
        launch = SimpleNamespace(
            deployment=self.deployment,
            get_launch_data=lambda: data if data is not None else self.launch_data,
        )
        token = issue_embedded_token(
            self.user,
            instance,
            launch,
            purpose=purpose,
            play_id=play.pk if play else None,
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        return token

    def test_navigation_and_picker_do_not_require_instance_course_or_resource(self):
        for purpose in ("course-navigation", "deep-link"):
            with self.subTest(purpose=purpose):
                self.use_grant(purpose, data={"sub": "123"})
                response = self.client.get("/api/embedded/context/")
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.data["view"], purpose)
                self.assertIsNone(response.data["instanceId"])
                self.assertIn("no-store", response["Cache-Control"])
                self.assertEqual(response["Referrer-Policy"], "no-referrer")
                for path in ("/api/users/", "/api/instances/?user=me", "/api/scores/"):
                    self.assertEqual(self.client.get(path).status_code, 403)
                self.assertEqual(self.start_play().status_code, 403)

    def test_embedded_only_views_ignore_session_cookies(self):
        self.client.force_login(self.user)
        for path in (
            "/api/embedded/context/",
            "/api/embedded/deep-link/instances/",
            "/api/embedded/scores/",
        ):
            self.assertEqual(self.client.get(path).status_code, 401)

    def test_grant_purposes_cannot_escalate_to_other_embedded_operations(self):
        for purpose in ("player", "course-navigation", "instructor-resource", "scores"):
            with self.subTest(purpose=purpose):
                self.use_grant(purpose, instance=self.instance)
                self.assertEqual(
                    self.client.get("/api/embedded/deep-link/instances/").status_code,
                    403,
                )
                self.assertEqual(
                    self.client.post(
                        "/api/embedded/deep-link/selection/",
                        {"instanceId": self.instance.pk},
                    ).status_code,
                    403,
                )
        self.use_grant("deep-link")
        self.assertEqual(self.client.get("/api/embedded/scores/").status_code, 403)
        self.assertEqual(
            self.client.post("/api/embedded/scores/resubmit/").status_code, 403
        )

    def test_deep_link_lists_only_currently_visible_instances_and_paginates(self):
        from django.utils import timezone
        from datetime import timedelta

        self.instance.permissions.create(user=self.user, permission="full")
        self.guest.permissions.create(
            user=self.user,
            permission="visible",
            expires_at=timezone.now() - timedelta(seconds=1),
        )
        self.use_grant("deep-link")
        response = self.client.get(
            "/api/embedded/deep-link/instances/",
            {"page_size": 1, "user": self.other_user.pk},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], self.instance.pk)
        self.assertIsNone(response.data["next"])
        self.instance.permissions.all().delete()
        self.assertEqual(
            self.client.get("/api/embedded/deep-link/instances/").data["count"], 0
        )

    def test_deep_link_revalidates_selection_and_signs_server_selected_resource(self):
        self.instance.permissions.create(user=self.user, permission="full")
        self.guest.permissions.create(user=self.user, permission="full")
        settings_claim = "https://purl.imsglobal.org/spec/lti-dl/claim/"
        data = {
            **self.launch_data,
            settings_claim
            + "deep_linking_settings": {
                "deep_link_return_url": "https://lms.example/return",
                "data": "platform-opaque-state",
                "accept_types": ["ltiResourceLink"],
            },
        }
        key = Key.objects.generate()
        self.use_grant("deep-link", data=data)
        response = self.client.post(
            "/api/embedded/deep-link/selection/",
            {
                "instanceId": self.instance.pk,
                "instance": "https://untrusted.example/",
                "return_url": "https://untrusted.example/",
                "lid": "untrusted",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["return_url"], "https://lms.example/return")
        claims = jwt.decode(
            response.data["JWT"],
            key.public_key,
            algorithms=["RS256"],
            audience="https://lms.example",
            issuer="client",
        )
        self.assertEqual(claims[CLAIM + "deployment_id"], "deployment")
        self.assertEqual(claims[settings_claim + "data"], "platform-opaque-state")
        self.assertEqual(
            claims[settings_claim + "content_items"][0]["url"], self.instance.embed_url
        )
        self.assertEqual(claims[CLAIM + "message_type"], "LtiDeepLinkingResponse")
        self.assertEqual(claims["exp"] - claims["iat"], 600)
        second = self.client.post(
            "/api/embedded/deep-link/selection/", {"instanceId": self.instance.pk}
        )
        second_claims = jwt.decode(
            second.data["JWT"], options={"verify_signature": False}
        )
        self.assertNotEqual(second_claims["nonce"], claims["nonce"])
        self.assertEqual(
            self.client.post(
                "/api/embedded/deep-link/selection/", {"instanceId": self.guest.pk}
            ).status_code,
            403,
        )
        self.instance.is_draft = True
        self.instance.save()
        self.assertEqual(
            self.client.post(
                "/api/embedded/deep-link/selection/", {"instanceId": self.instance.pk}
            ).status_code,
            403,
        )
        self.instance.permissions.all().delete()
        self.assertEqual(
            self.client.post(
                "/api/embedded/deep-link/selection/", {"instanceId": self.instance.pk}
            ).status_code,
            404,
        )
        self.assertFalse(self.client.cookies)

    def test_deep_link_missing_settings_and_expired_grants_fail_explicitly(self):
        self.instance.permissions.create(user=self.user, permission="full")
        token = self.use_grant("deep-link")
        response = self.client.post(
            "/api/embedded/deep-link/selection/", {"instanceId": self.instance.pk}
        )
        self.assertEqual(response.status_code, 403)
        cache.delete(_grant_key(token))
        self.assertEqual(
            self.client.post(
                "/api/embedded/deep-link/selection/", {"instanceId": self.instance.pk}
            ).status_code,
            401,
        )

    def create_review_play(self, user=None):
        self.authenticate()
        play_id = self.start_play().data["playId"]
        LogPlay.objects.filter(pk=play_id).update(
            user=user or self.other_user, is_complete=True, context_id="another-course"
        )
        return LogPlay.objects.get(pk=play_id)

    def test_score_review_preserves_owner_permission_elevated_and_lti_role_access(self):
        play = self.create_review_play()
        instructor = "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor"
        staff = "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Instructor"
        for access in ("owner", "permission", "support", "instructor", "staff", "none"):
            with self.subTest(access=access):
                data = {**self.launch_data}
                if access in {"instructor", "staff"}:
                    data[CLAIM + "roles"] = [
                        instructor if access == "instructor" else staff
                    ]
                if access == "owner":
                    LogPlay.objects.filter(pk=play.pk).update(user=self.user)
                if access == "permission":
                    self.instance.permissions.create(
                        user=self.user, permission="visible"
                    )
                if access == "support":
                    self.user.groups.add(self.support_group)
                self.use_grant("scores", instance=self.instance, play=play, data=data)
                response = self.client.get("/api/embedded/scores/")
                self.assertEqual(response.status_code, 403 if access == "none" else 200)
                if access != "none":
                    self.assertIn("qset", response.data)
                    self.assertEqual(
                        response.data["lti"]["canResubmit"],
                        access in {"owner", "permission", "support"},
                    )
                    self.assertEqual(
                        self.client.get("/api/embedded/context/").status_code, 200
                    )
                self.assertEqual(
                    self.client.put(
                        f"/api/play-sessions/{play.pk}/", {"logs": []}
                    ).status_code,
                    403,
                )
                LogPlay.objects.filter(pk=play.pk).update(user=self.other_user)
                self.instance.permissions.all().delete()
                self.user.groups.remove(self.support_group)

    def test_score_review_target_substitution_and_history_boundary(self):
        play = self.create_review_play(user=self.user)
        other = self.create_review_play()
        self.use_grant("scores", instance=self.instance, play=play)
        self.assertEqual(
            self.client.get("/api/embedded/scores/", {"play_id": other.pk}).status_code,
            403,
        )
        self.assertEqual(
            self.client.post(
                "/api/embedded/scores/resubmit/", {"play_id": other.pk}
            ).status_code,
            403,
        )
        self.use_grant("scores", instance=self.instance)
        history = self.client.get("/api/embedded/scores/")
        self.assertEqual([score["id"] for score in history.data["scores"]], [play.pk])
        self.assertEqual(
            self.client.get("/api/embedded/scores/", {"play_id": other.pk}).status_code,
            404,
        )
        self.assertEqual(
            self.client.get("/api/embedded/scores/", {"play_id": play.pk}).status_code,
            200,
        )
        self.assertEqual(
            self.client.get(f"/api/instances/{self.guest.pk}/").status_code, 403
        )
        self.assertEqual(
            self.client.get(f"/api/instances/{self.instance.pk}/").status_code, 200
        )

    def test_review_retry_checks_independent_permissions_and_existing_limits(self):
        play = self.create_review_play()
        state = play.lti_play_state
        state.submission_status = LtiPlayState.SubmissionStatus.ERR_FAILURE
        state.save()
        data = {
            **self.launch_data,
            CLAIM
            + "roles": ["http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor"],
        }
        self.use_grant("scores", instance=self.instance, play=play, data=data)
        with patch(
            "api.score_services.AGSService.submit_score_for_play",
            return_value=LtiPlayState.SubmissionStatus.SUCCESS,
        ) as submit:
            self.assertEqual(
                self.client.post("/api/embedded/scores/resubmit/").status_code, 403
            )
            submit.assert_not_called()
            self.instance.permissions.create(user=self.user, permission="visible")
            self.assertEqual(
                self.client.post("/api/embedded/scores/resubmit/").status_code, 200
            )
            submit.assert_called_once()
            state.submission_attempts = 4
            state.save()
            self.assertEqual(
                self.client.post("/api/embedded/scores/resubmit/").status_code, 400
            )
            self.user.groups.add(self.support_group)
            self.assertEqual(
                self.client.post("/api/embedded/scores/resubmit/").status_code, 200
            )
        state.submission_status = LtiPlayState.SubmissionStatus.SUCCESS
        state.save()
        self.assertEqual(
            self.client.post("/api/embedded/scores/resubmit/").status_code, 400
        )

    def test_all_supported_validated_launches_render_without_session_mutation(self):
        play = self.create_review_play(user=self.user)
        cases = (
            ("course-navigation", "http://testserver/ltilaunch/", False),
            ("deep-link", "http://testserver/ltilaunch/", True),
            ("instructor-resource", "http://testserver/embed/embed123/", False),
            (
                "scores",
                f"http://testserver/scores/single/{self.instance.pk}/{play.pk}/",
                False,
            ),
            (
                "scores",
                f"http://testserver/scores/single/{self.instance.pk}/{play.pk}",
                False,
            ),
            (
                "scores",
                f"http://testserver/scores/single/{play.pk}/{self.instance.pk}/",
                False,
            ),
            ("scores", f"http://testserver/scores/{self.instance.pk}/", False),
        )
        for purpose, target, deep in cases:
            with self.subTest(purpose=purpose, target=target):
                data = {**self.launch_data, CLAIM + "target_link_uri": target}
                if purpose in {"course-navigation", "deep-link"}:
                    data.pop(CLAIM + "context")
                    data.pop(CLAIM + "resource_link")
                if purpose == "instructor-resource":
                    data[CLAIM + "roles"] = [
                        "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor"
                    ]
                launch = SimpleNamespace(
                    deployment=self.deployment,
                    get_launch_data=lambda: data,
                    get_launch_id=lambda: "launch-id",
                    is_resource_launch=not deep,
                    is_deep_link_launch=deep,
                )
                request = RequestFactory().post("/ltilaunch/")
                SessionMiddleware(lambda request: None).process_request(request)
                request.session["preserved"] = True
                request.user = AnonymousUser()
                with (
                    patch("lti.views.launch.sync_data_from_launch"),
                    patch(
                        "lti.views.launch.LTIAuthService.authenticate",
                        return_value=self.user,
                    ),
                    patch(
                        "lti.views.launch.issue_embedded_token",
                        wraps=issue_embedded_token,
                    ) as issue,
                ):
                    response = ApplicationLaunchView().process_validated_launch(
                        request, launch
                    )
                self.assertContains(response, "EMBEDDED_ACCESS_TOKEN")
                self.assertEqual(request.session["preserved"], True)
                self.assertNotIn("lti-deep-link", request.session)
                self.assertNotIn("Location", response)
                self.assertEqual(issue.call_args.kwargs["purpose"], purpose)
                if purpose == "instructor-resource":
                    self.assertTrue(
                        self.instance.permissions.filter(
                            user=self.user, context_id="course"
                        ).exists()
                    )
        self.assertEqual(LogPlay.objects.count(), 1)

    def test_malformed_or_unrelated_launch_targets_do_not_issue_credentials(self):
        request = RequestFactory().post("/ltilaunch/")
        request.user = AnonymousUser()
        for target in (
            "https://untrusted.example/embed/embed123/",
            "http://[bad/embed/embed123/",
            "http://testserver/my-widgets/",
            "http://testserver/preview/embed123/",
            "http://testserver/embed/missing/",
        ):
            with self.subTest(target=target):
                data = {**self.launch_data, CLAIM + "target_link_uri": target}
                self.launch.get_launch_data = lambda: data
                with (
                    patch("lti.views.launch.issue_embedded_token") as issue,
                    patch(
                        "lti.views.launch.LTIAuthService.authenticate"
                    ) as authenticate,
                ):
                    response = ApplicationLaunchView().get_embedded_launch_response(
                        request, self.launch
                    )
                self.assertContains(response, "error_unknown_assignment")
                self.assertNotContains(response, "EMBEDDED_ACCESS_TOKEN")
                issue.assert_not_called()
                authenticate.assert_not_called()
        self.assertFalse(LogPlay.objects.exists())

    def test_lti_guest_launch_parameters_cannot_bypass_guest_rejection(self):
        for params in ({"lid": "missing-launch"}, {"token": "missing-play"}):
            response = self.client.get(f"/embed/{self.guest.pk}/", params)
            self.assertNotContains(
                response, "EMBEDDED_ACCESS_TOKEN", status_code=response.status_code
            )
        self.assertFalse(LogPlay.objects.exists())

    def test_player_resource_launch_still_requires_course_and_resource_claims(self):
        request = RequestFactory().post("/ltilaunch/")
        request.user = AnonymousUser()
        for missing in ("context", "resource_link"):
            data = {**self.launch_data}
            data.pop(CLAIM + missing)
            self.launch.get_launch_data = lambda: data
            with patch("lti.views.launch.issue_embedded_token") as issue:
                response = ApplicationLaunchView().get_embedded_launch_response(
                    request, self.launch
                )
            self.assertContains(response, "error_launch_validation")
            issue.assert_not_called()

    def test_guest_and_missing_score_targets_fail_before_provisioning(self):
        request = RequestFactory().post("/ltilaunch/")
        request.user = AnonymousUser()
        for target, error in (
            (f"http://testserver/embed/{self.guest.pk}/", "error_lti_guest_mode"),
            (
                f"http://testserver/scores/single/{self.instance.pk}/missing-play/",
                "error_unknown_assignment",
            ),
        ):
            with self.subTest(target=target):
                data = {**self.launch_data, CLAIM + "target_link_uri": target}
                self.launch.get_launch_data = lambda: data
                with (
                    patch(
                        "lti.views.launch.LTIAuthService.authenticate"
                    ) as authenticate,
                    patch("lti.views.launch.issue_embedded_token") as issue,
                ):
                    response = ApplicationLaunchView().get_embedded_launch_response(
                        request, self.launch
                    )
                self.assertContains(response, error)
                authenticate.assert_not_called()
                issue.assert_not_called()

    def test_user_provisioning_failures_do_not_register_or_issue_grants(self):
        request = RequestFactory().post("/ltilaunch/")
        request.user = AnonymousUser()
        for failure in (None, LTIAuthException()):
            with self.subTest(failure=failure):
                with (
                    patch(
                        "lti.views.launch.LTIAuthService.authenticate",
                        return_value=None,
                        side_effect=failure,
                    ) as authenticate,
                    patch(
                        "lti.views.launch.LTILaunchService.register_association"
                    ) as register,
                    patch("lti.views.launch.issue_embedded_token") as issue,
                ):
                    response = ApplicationLaunchView().get_embedded_launch_response(
                        request, self.launch
                    )
                self.assertContains(response, "error_unknown_user")
                authenticate.assert_called_once_with(
                    request, self.launch_data, use_session=False
                )
                register.assert_not_called()
                issue.assert_not_called()

    def test_denied_score_review_fails_after_provisioning_without_launch_side_effects(
        self,
    ):
        play = self.create_review_play()
        data = {
            **self.launch_data,
            CLAIM
            + "target_link_uri": f"http://testserver/scores/single/{self.instance.pk}/{play.pk}/",
        }
        self.launch.get_launch_data = lambda: data
        request = RequestFactory().post("/ltilaunch/")
        request.user = AnonymousUser()
        with (
            patch(
                "lti.views.launch.LTIAuthService.authenticate", return_value=self.user
            ) as authenticate,
            patch("lti.views.launch.can_review_scores", return_value=False) as review,
            patch(
                "lti.views.launch.LTILaunchService.ensure_instructor_visibility"
            ) as visibility,
            patch("lti.views.launch.LTILaunchService.register_association") as register,
            patch("lti.views.launch.issue_embedded_token") as issue,
        ):
            response = ApplicationLaunchView().get_embedded_launch_response(
                request, self.launch
            )
        self.assertContains(response, "error_launch_validation")
        authenticate.assert_called_once_with(request, data, use_session=False)
        review.assert_called_once_with(
            self.user, self.instance, play=play, launch_data=data
        )
        visibility.assert_not_called()
        register.assert_not_called()
        issue.assert_not_called()

    def test_instructor_side_effects_precede_token_storage_failure(self):
        data = {
            **self.launch_data,
            CLAIM
            + "roles": ["http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor"],
        }
        self.launch.get_launch_data = lambda: data
        request = RequestFactory().post("/ltilaunch/")
        request.user = AnonymousUser()
        calls = Mock()
        with (
            patch(
                "lti.views.launch.LTIAuthService.authenticate", return_value=self.user
            ) as authenticate,
            patch(
                "lti.views.launch.LTILaunchService.ensure_instructor_visibility",
                return_value=True,
            ) as visibility,
            patch("lti.views.launch.LTILaunchService.register_association") as register,
            patch(
                "lti.views.launch.issue_embedded_token",
                side_effect=AuthenticationFailed("Storage unavailable"),
            ) as issue,
        ):
            for name, mock in (
                ("authenticate", authenticate),
                ("visibility", visibility),
                ("register", register),
                ("issue", issue),
            ):
                calls.attach_mock(mock, name)
            response = ApplicationLaunchView().get_embedded_launch_response(
                request, self.launch
            )
        self.assertContains(response, "error_launch_validation")
        self.assertEqual(
            [call[0] for call in calls.mock_calls],
            ["authenticate", "visibility", "register", "issue"],
        )
        visibility.assert_called_once_with(self.user, self.instance, "course")
        register.assert_called_once_with(
            data, self.user, self.instance, deployment=self.deployment
        )
        self.assertTrue(issue.call_args.kwargs["provisional_access"])

    def test_deep_link_listing_follows_scoped_pagination(self):
        self.instance.permissions.create(user=self.user, permission="full")
        self.guest.permissions.create(user=self.user, permission="full")
        self.use_grant("deep-link")
        first = self.client.get("/api/embedded/deep-link/instances/", {"page_size": 1})
        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.data["count"], 2)
        self.assertEqual(len(first.data["results"]), 1)
        second = self.client.get(first.data["next"])
        self.assertEqual(second.status_code, 200)
        self.assertIsNone(second.data["next"])
        self.assertEqual(
            {item["id"] for item in first.data["results"] + second.data["results"]},
            {self.instance.pk, self.guest.pk},
        )

    def test_role_based_score_review_is_not_restricted_to_launch_deployment(self):
        play = self.create_review_play()
        deployment = LtiDeployment.objects.create(
            registration=self.registration,
            deployment_id="other-deployment",
            is_active=True,
        )
        association = Lti.objects.create(
            widget_instance=self.instance,
            resource_link="other-resource",
            deployment=deployment,
            lti_version="1.3",
        )
        LtiPlayState.objects.filter(play=play).update(lti_association=association)
        data = {
            **self.launch_data,
            "iat": 1,
            CLAIM
            + "roles": [
                "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Instructor"
            ],
        }
        self.use_grant("scores", instance=self.instance, play=play, data=data)
        response = self.client.get("/api/embedded/scores/")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["lti"]["canResubmit"])

    def test_embedded_and_first_party_score_history_keep_the_same_shape(self):
        self.create_review_play(user=self.user)
        self.use_grant("scores", instance=self.instance)
        embedded = self.client.get("/api/embedded/scores/")
        self.client.credentials()
        self.client.force_login(self.user)
        first_party = self.client.get(
            "/api/scores/",
            {"inst_id": self.instance.pk, "user": self.user.pk, "context": "course"},
        )
        self.assertEqual(embedded.status_code, 200)
        self.assertEqual(first_party.status_code, 200)
        self.assertEqual(embedded.data, first_party.data)

    @override_settings(EMBEDDED_AUTH_ENABLED=False)
    def test_flag_off_launches_keep_legacy_handlers(self):
        request = RequestFactory().post("/ltilaunch/")
        SessionMiddleware(lambda request: None).process_request(request)
        request.user = AnonymousUser()
        for deep in (False, True):
            self.launch.is_resource_launch = not deep
            self.launch.is_deep_link_launch = deep
            handler_name = (
                "handle_deep_linking_launch" if deep else "handle_resource_launch"
            )
            view = ApplicationLaunchView()
            with (
                patch("lti.views.launch.sync_data_from_launch"),
                patch.object(view, "get_embedded_launch_response") as embedded,
                patch.object(view, handler_name, return_value="legacy") as legacy,
            ):
                self.assertEqual(
                    view.process_validated_launch(request, self.launch), "legacy"
                )
                embedded.assert_not_called()
                legacy.assert_called_once()
