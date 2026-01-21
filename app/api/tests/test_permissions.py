from unittest.mock import Mock
from django.contrib.auth.models import Group, User
from django.test import TestCase
from rest_framework import permissions
from api.permissions import (
    DenyAll,
    IsSuperOrSupportUser,
    IsSuperuser,
    IsUserSelf,
    ReadOnlyIfAuthenticated,
)


class DenyAllTestCase(TestCase):

    def test_deny_all_returns_false(self):
        permission = DenyAll()
        request = Mock()
        view = Mock()

        self.assertFalse(permission.has_permission(request, view))


class IsSuperuserTestCase(TestCase):
    def setUp(self):
        self.permission = IsSuperuser()
        self.view = Mock()

    def test_superuser_allowed(self):
        request = Mock()
        request.user = Mock(is_superuser=True)
        self.assertTrue(self.permission.has_permission(request, self.view))

    def test_regular_user_denied(self):
        request = Mock()
        request.user = Mock(is_superuser=False)
        self.assertFalse(self.permission.has_permission(request, self.view))

    def test_no_user_denied(self):
        request = Mock()
        request.user = None
        self.assertFalse(self.permission.has_permission(request, self.view))


class IsSuperOrSupportUserTestCase(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.support_group, _ = Group.objects.get_or_create(name="support_user")

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

    def setUp(self):
        self.permission = IsSuperOrSupportUser()
        self.view = Mock()

    def test_superuser_allowed(self):
        request = Mock()
        request.user = self.superuser
        self.assertTrue(self.permission.has_permission(request, self.view))

    def test_support_user_allowed(self):
        request = Mock()
        request.user = self.support_user
        self.assertTrue(self.permission.has_permission(request, self.view))

    def test_regular_user_denied(self):
        request = Mock()
        request.user = self.regular_user
        self.assertFalse(self.permission.has_permission(request, self.view))


class IsUserSelfTestCase(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user1 = User.objects.create_user(
            username="user1",
            email="user1@example.com",
            password="testpass123",
        )

        cls.user2 = User.objects.create_user(
            username="user2",
            email="user2@example.com",
            password="testpass123",
        )

    def setUp(self):
        self.permission = IsUserSelf()
        self.view = Mock()

    def test_has_permission_authenticated(self):
        request = Mock()
        request.user = self.user1

        self.assertTrue(self.permission.has_permission(request, self.view))

    def test_has_permission_unauthenticated(self):
        request = Mock()
        request.user = Mock(is_authenticated=False)

        self.assertFalse(self.permission.has_permission(request, self.view))

    def test_has_object_permission_self(self):
        request = Mock()
        request.user = self.user1

        self.assertTrue(
            self.permission.has_object_permission(request, self.view, self.user1)
        )

    def test_has_object_permission_other_user(self):
        request = Mock()
        request.user = self.user1

        self.assertFalse(
            self.permission.has_object_permission(request, self.view, self.user2)
        )

    def test_has_object_permission_unauthenticated(self):
        request = Mock()
        request.user = Mock(is_authenticated=False)

        self.assertFalse(
            self.permission.has_object_permission(request, self.view, self.user1)
        )


class ReadOnlyIfAuthenticatedTestCase(TestCase):
    def setUp(self):
        self.permission = ReadOnlyIfAuthenticated()
        self.view = Mock()

    def test_authenticated_safe_method_allowed(self):
        for method in permissions.SAFE_METHODS:
            request = Mock()
            request.user = Mock(is_authenticated=True)
            request.method = method

            self.assertTrue(
                self.permission.has_permission(request, self.view),
                f"Failed for method {method}",
            )

    def test_unauthenticated_denied(self):
        request = Mock()
        request.user = Mock(is_authenticated=False)
        request.method = "GET"

        self.assertFalse(self.permission.has_permission(request, self.view))
