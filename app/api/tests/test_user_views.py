from django.contrib.auth.models import Group, User
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from core.models import ObjectPermission, Widget, WidgetInstance


class UserViewSetTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.author_group, _ = Group.objects.get_or_create(name="basic_author")
        cls.support_group, _ = Group.objects.get_or_create(name="support_user")

        cls.regular_user = User.objects.create_user(
            username="regular",
            email="regular@example.com",
            password="testpass123",
            first_name="Regular",
            last_name="User",
        )

        cls.author_user = User.objects.create_user(
            username="author",
            email="author@example.com",
            password="testpass123",
            first_name="Author",
            last_name="Person",
        )
        cls.author_user.groups.add(cls.author_group)

        cls.support_user = User.objects.create_user(
            username="support",
            email="support@example.com",
            password="testpass123",
            first_name="Support",
            last_name="Staff",
        )
        cls.support_user.groups.add(cls.support_group)

        cls.superuser = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="testpass123",
            first_name="Admin",
            last_name="Super",
        )

        cls.john_doe = User.objects.create_user(
            username="johndoe",
            email="john.doe@example.com",
            password="testpass123",
            first_name="John",
            last_name="Doe",
        )

        cls.jane_doe = User.objects.create_user(
            username="janedoe",
            email="jane.doe@example.com",
            password="testpass123",
            first_name="Jane",
            last_name="Doe",
        )

        cls.widget = Widget.objects.create(
            name="Test Widget",
            clean_name="test-widget",
            is_editable=True,
            is_playable=True,
        )

        cls.user_instance = WidgetInstance.objects.create(
            id="userins01",
            widget=cls.widget,
            user=cls.regular_user,
            name="User Instance",
            is_draft=False,
        )

        cls.user_perm = ObjectPermission.objects.create(
            user=cls.regular_user,
            content_object=cls.user_instance,
            permission=ObjectPermission.PERMISSION_FULL,
        )

    def setUp(self):
        self.client = APIClient()


class TestMeEndpoint(UserViewSetTestCase):
    """Tests for GET /api/users/me/"""

    def test_unauthenticated_returns_403(self):
        response = self.client.get("/api/users/me/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_returns_current_user_data(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/users/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.regular_user.id)
        self.assertEqual(response.data["username"], self.regular_user.username)
        self.assertEqual(response.data["email"], self.regular_user.email)

    def test_includes_profile_fields(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/users/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("profile_fields", response.data)

    def test_includes_is_student_field(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/users/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("is_student", response.data)
        self.assertTrue(response.data["is_student"])

    def test_author_is_not_student(self):
        self.client.force_authenticate(user=self.author_user)
        response = self.client.get("/api/users/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_student"])


class TestUserSearch(UserViewSetTestCase):
    """Tests for GET /api/users/?search="""

    def test_unauthenticated_returns_403(self):
        response = self.client.get("/api/users/", {"search": "John"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_search_by_first_name(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/users/", {"search": "John"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        first_names = [u["first_name"] for u in response.data["results"]]
        self.assertIn("John", first_names)

    def test_search_by_last_name(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/users/", {"search": "Doe"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        last_names = [u["last_name"] for u in response.data["results"]]
        self.assertIn("Doe", last_names)

    def test_search_by_email(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/users/", {"search": "john.doe@example.com"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data["results"]), 1)

    def test_search_multi_part_name(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/users/", {"search": "John Doe"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        found = any(
            u["first_name"] == "John" and u["last_name"] == "Doe"
            for u in response.data["results"]
        )
        self.assertTrue(found)

    def test_excludes_self_from_results(self):
        self.client.force_authenticate(user=self.john_doe)
        response = self.client.get("/api/users/", {"search": "John"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user_ids = [u["id"] for u in response.data["results"]]
        self.assertNotIn(self.john_doe.id, user_ids)

    def test_excludes_superusers_from_results(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/users/", {"search": "Admin"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user_ids = [u["id"] for u in response.data["results"]]
        self.assertNotIn(self.superuser.id, user_ids)

    def test_list_without_search_or_ids_returns_403(self):
        """Listing all users is denied by design - must provide search or ids."""
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/users/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TestUserRetrieve(UserViewSetTestCase):
    """Tests for GET /api/users/{id}/"""

    def test_unauthenticated_returns_403(self):
        response = self.client.get(f"/api/users/{self.regular_user.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_elevated_user_gets_limited_fields(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(f"/api/users/{self.john_doe.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("email", response.data)
        self.assertNotIn("username", response.data)
        self.assertNotIn("profile_fields", response.data)

    def test_support_user_gets_full_fields(self):
        self.client.force_authenticate(user=self.support_user)
        response = self.client.get(f"/api/users/{self.john_doe.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("email", response.data)
        self.assertIn("username", response.data)


class TestUserIdsList(UserViewSetTestCase):
    """Tests for GET /api/users/?ids="""

    def test_unauthenticated_returns_403(self):
        response = self.client.get(
            "/api/users/", {"ids": f"{self.john_doe.id},{self.jane_doe.id}"}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_returns_requested_users(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(
            "/api/users/", {"ids": f"{self.john_doe.id},{self.jane_doe.id}"}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 2)

    def test_invalid_ids_returns_400(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/users/", {"ids": "invalid,ids"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TestRolesEndpoint(UserViewSetTestCase):
    """Tests for GET/PATCH /api/users/{id}/roles/"""

    def test_get_roles_unauthenticated_returns_403(self):
        response = self.client.get(f"/api/users/{self.regular_user.id}/roles/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_regular_user_cannot_get_other_user_roles(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(f"/api/users/{self.john_doe.id}/roles/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_support_user_can_get_roles(self):
        self.client.force_authenticate(user=self.support_user)
        response = self.client.get(f"/api/users/{self.regular_user.id}/roles/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("student", response.data)
        self.assertIn("author", response.data)
        self.assertIn("support_user", response.data)

    def test_student_role_values(self):
        self.client.force_authenticate(user=self.support_user)
        response = self.client.get(f"/api/users/{self.regular_user.id}/roles/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["student"])
        self.assertFalse(response.data["author"])

    def test_author_role_values(self):
        self.client.force_authenticate(user=self.support_user)
        response = self.client.get(f"/api/users/{self.author_user.id}/roles/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["student"])
        self.assertTrue(response.data["author"])

    def test_regular_user_cannot_patch_roles(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.patch(
            f"/api/users/{self.john_doe.id}/roles/",
            {"id": self.john_doe.id, "student": False, "author": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_support_user_cannot_patch_roles(self):
        self.client.force_authenticate(user=self.support_user)
        response = self.client.patch(
            f"/api/users/{self.john_doe.id}/roles/",
            {"id": self.john_doe.id, "student": False, "author": True},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_superuser_can_patch_roles(self):
        self.client.force_authenticate(user=self.superuser)
        response = self.client.patch(
            f"/api/users/{self.john_doe.id}/roles/",
            {
                "id": self.john_doe.id,
                "student": False,
                "author": True,
                "support_user": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.john_doe.refresh_from_db()
        self.assertTrue(self.john_doe.groups.filter(name="basic_author").exists())


class TestLoginEndpoint(TestCase):
    """Tests for POST /api/user/login/"""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="logintest",
            email="login@example.com",
            password="testpass123",
        )

    def setUp(self):
        self.client = APIClient()

    def test_valid_credentials_returns_200(self):
        response = self.client.post(
            "/api/user/login/",
            {"username": "logintest", "password": "testpass123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.json()["isAuthenticated"])

    def test_invalid_credentials_returns_401(self):
        response = self.client.post(
            "/api/user/login/",
            {"username": "logintest", "password": "wrongpassword"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.json()["isAuthenticated"])

    def test_invalid_json_returns_400(self):
        response = self.client.post(
            "/api/user/login/",
            "not json",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_request_returns_405(self):
        response = self.client.get("/api/user/login/")

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class TestLogoutEndpoint(TestCase):
    """Tests for GET /users/logout/"""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="logouttest",
            email="logout@example.com",
            password="testpass123",
        )

    def setUp(self):
        self.client = APIClient()

    def test_logout_redirects_to_root(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/users/logout/")

        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.assertEqual(response.url, "/")


class TestPermsEndpoint(UserViewSetTestCase):
    """Tests for GET /api/users/{id}/perms/"""

    def test_unauthenticated_returns_403(self):
        response = self.client.get(f"/api/users/{self.regular_user.id}/perms/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_can_get_own_perms(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(f"/api/users/{self.regular_user.id}/perms/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_user_cannot_get_other_user_perms(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(f"/api/users/{self.john_doe.id}/perms/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_support_user_can_get_other_user_perms(self):
        self.client.force_authenticate(user=self.support_user)
        response = self.client.get(f"/api/users/{self.regular_user.id}/perms/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_superuser_can_get_other_user_perms(self):
        self.client.force_authenticate(user=self.superuser)
        response = self.client.get(f"/api/users/{self.regular_user.id}/perms/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_perms_filter_by_type(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(
            f"/api/users/{self.regular_user.id}/perms/",
            {"type": "widgetinstance"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_perms_invalid_type_returns_400(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(
            f"/api/users/{self.regular_user.id}/perms/",
            {"type": "invalidtype"},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
