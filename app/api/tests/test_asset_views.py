from datetime import timedelta

from api.tests.base import MateriaTestCase
from core.models import Asset, ObjectPermission
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient


class AssetViewSetTestCase(MateriaTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.owner = User.objects.create_user(username="asset_owner")
        cls.viewer = User.objects.create_user(username="asset_viewer")
        cls.other = User.objects.create_user(username="asset_other")
        cls.superuser = User.objects.create_superuser(
            username="asset_admin", email="admin@example.com", password="testpass"
        )
        cls.support = User.objects.create_user(username="asset_support")
        cls.support.groups.add(cls.support_group)
        cls.asset = Asset.objects.create(
            id="asset001", title="Image", file_type="png", file_size=42
        )
        cls.unrelated = Asset.objects.create(
            id="asset002", title="Other image", file_type="jpg"
        )
        cls.expired = Asset.objects.create(id="asset003", file_type="png")
        cls.asset.permissions.create(
            user=cls.owner, permission=ObjectPermission.PERMISSION_FULL
        )
        cls.asset.permissions.create(
            user=cls.viewer,
            permission=ObjectPermission.PERMISSION_VISIBLE,
            expires_at=timezone.now() + timedelta(days=1),
        )
        cls.unrelated.permissions.create(
            user=cls.other, permission=ObjectPermission.PERMISSION_FULL
        )
        cls.expired.permissions.create(
            user=cls.owner,
            permission=ObjectPermission.PERMISSION_FULL,
            expires_at=timezone.now() - timedelta(days=1),
        )

    def setUp(self):
        self.client = APIClient()

    def assert_metadata(self, data, asset):
        self.assertEqual(data["id"], asset.id)
        self.assertEqual(data["title"], asset.title)
        self.assertEqual(data["file_type"], asset.file_type)
        self.assertEqual(data["file_size"], asset.file_size)
        self.assertEqual(data["is_deleted"], asset.is_deleted)
        self.assertIn("created_at", data)
        self.assertIn("deleted_at", data)


class TestAssetRead(AssetViewSetTestCase):
    def test_list_is_scoped_to_active_permissions(self):
        for user in (self.owner, self.viewer, self.other):
            with self.subTest(user=user.username):
                self.client.force_authenticate(user=user)
                response = self.client.get("/api/assets/")
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                expected = self.unrelated if user == self.other else self.asset
                self.assertEqual([row["id"] for row in response.data], [expected.id])
                self.assert_metadata(response.data[0], expected)

    def test_user_without_permissions_has_empty_list(self):
        self.client.force_authenticate(user=self.support)
        response = self.client.get("/api/assets/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_retrieve_with_full_or_visible_permissions(self):
        for user in (self.owner, self.viewer):
            with self.subTest(user=user.username):
                self.client.force_authenticate(user=user)
                response = self.client.get(f"/api/assets/{self.asset.id}/")
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assert_metadata(response.data, self.asset)

    def test_inaccessible_expired_and_missing_assets_return_404(self):
        self.client.force_authenticate(user=self.owner)
        for asset_id in (self.unrelated.id, self.expired.id, "missing"):
            with self.subTest(asset_id=asset_id):
                response = self.client.get(f"/api/assets/{asset_id}/")
                self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_elevated_roles_still_use_asset_permission_filter(self):
        for user in (self.superuser, self.support):
            with self.subTest(user=user.username):
                self.client.force_authenticate(user=user)
                response = self.client.get(f"/api/assets/{self.asset.id}/")
                self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
                self.asset.permissions.create(
                    user=user, permission=ObjectPermission.PERMISSION_VISIBLE
                )
                response = self.client.get(f"/api/assets/{self.asset.id}/")
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assert_metadata(response.data, self.asset)

    def test_anonymous_reads_return_403(self):
        for url in ("/api/assets/", f"/api/assets/{self.asset.id}/"):
            with self.subTest(url=url):
                response = self.client.get(url)
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TestAssetCreate(AssetViewSetTestCase):
    def test_authenticated_users_can_create_metadata(self):
        for index, user in enumerate(
            (self.owner, self.other, self.superuser, self.support)
        ):
            with self.subTest(user=user.username):
                self.client.force_authenticate(user=user)
                payload = {
                    "id": f"newasset{index}",
                    "title": "New image",
                    "file_type": "png",
                    "file_size": 123,
                }
                before = Asset.objects.count()
                response = self.client.post("/api/assets/", payload, format="json")
                self.assertEqual(response.status_code, status.HTTP_201_CREATED)
                self.assertEqual(Asset.objects.count(), before + 1)
                asset = Asset.objects.get(pk=payload["id"])
                self.assert_metadata(response.data, asset)
                self.assertEqual(asset.title, payload["title"])
                self.assertEqual(asset.file_size, payload["file_size"])
                self.assertEqual(asset.file_type, payload["file_type"])
                self.assertFalse(asset.permissions.exists())

    def test_invalid_metadata_does_not_create_rows(self):
        self.client.force_authenticate(user=self.owner)
        for field, value in (
            ("id", self.asset.id),
            ("id", "x" * 11),
            ("title", "x" * 301),
            ("file_size", "not-a-number"),
        ):
            with self.subTest(field=field, value=value):
                payload = {"id": "newasset", "file_type": "png", field: value}
                before = list(Asset.objects.values())
                response = self.client.post("/api/assets/", payload, format="json")
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn(field, response.json()["msg"])
                self.assertEqual(list(Asset.objects.values()), before)


class TestAssetUpdate(AssetViewSetTestCase):
    def test_full_and_visible_permissions_allow_put_and_patch(self):
        for user in (self.owner, self.viewer):
            for method in ("put", "patch"):
                with self.subTest(user=user.username, method=method):
                    self.client.force_authenticate(user=user)
                    payload = {
                        "id": self.asset.id,
                        "title": f"{user.username}-{method}",
                        "file_type": "jpg",
                        "file_size": 99,
                    }
                    response = getattr(self.client, method)(
                        f"/api/assets/{self.asset.id}/", payload, format="json"
                    )
                    self.assertEqual(response.status_code, status.HTTP_200_OK)
                    self.asset.refresh_from_db()
                    self.assert_metadata(response.data, self.asset)
                    for field, value in payload.items():
                        self.assertEqual(getattr(self.asset, field), value)

    def test_patch_preserves_unspecified_metadata(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.patch(
            f"/api/assets/{self.asset.id}/", {"title": "Renamed"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.asset.refresh_from_db()
        self.assertEqual(self.asset.title, "Renamed")
        self.assertEqual(self.asset.file_type, "png")
        self.assertEqual(self.asset.file_size, 42)

    def test_invalid_update_does_not_change_asset(self):
        self.client.force_authenticate(user=self.owner)
        for method in ("put", "patch"):
            with self.subTest(method=method):
                before = list(Asset.objects.values())
                response = getattr(self.client, method)(
                    f"/api/assets/{self.asset.id}/",
                    {"title": "Renamed", "file_size": "invalid"},
                    format="json",
                )
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn("file_size", response.json()["msg"])
                self.assertEqual(list(Asset.objects.values()), before)


class TestAssetDeleteRestore(AssetViewSetTestCase):
    def test_delete_and_restore_preserve_row_and_permissions(self):
        for user in (self.owner, self.viewer):
            with self.subTest(user=user.username):
                self.client.force_authenticate(user=user)
                before_count = Asset.objects.count()
                before_permissions = list(self.asset.permissions.values())
                response = self.client.delete(f"/api/assets/{self.asset.id}/")
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(
                    response.data, {"detail": "Asset deleted.", "status": 200}
                )
                self.asset.refresh_from_db()
                self.assertTrue(self.asset.is_deleted)
                self.assertIsNotNone(self.asset.deleted_at)
                self.assertEqual(Asset.objects.count(), before_count)
                self.assertEqual(
                    list(self.asset.permissions.values()), before_permissions
                )
                response = self.client.get(f"/api/assets/{self.asset.id}/")
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertTrue(response.data["is_deleted"])
                response = self.client.post(f"/api/assets/{self.asset.id}/restore/")
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertEqual(
                    response.data, {"detail": "Asset restored.", "status": 200}
                )
                self.asset.refresh_from_db()
                self.assertFalse(self.asset.is_deleted)
                self.assertIsNone(self.asset.deleted_at)
                self.assertEqual(Asset.objects.count(), before_count)
                self.assertEqual(
                    list(self.asset.permissions.values()), before_permissions
                )


class TestAssetDeniedWrites(AssetViewSetTestCase):
    def test_anonymous_writes_return_403_without_changes(self):
        for method, url, payload in (
            ("post", "/api/assets/", {"id": "newasset", "file_type": "png"}),
            ("put", f"/api/assets/{self.asset.id}/", {"title": "Changed"}),
            ("patch", f"/api/assets/{self.asset.id}/", {"title": "Changed"}),
            ("delete", f"/api/assets/{self.asset.id}/", {}),
            ("post", f"/api/assets/{self.asset.id}/restore/", {}),
        ):
            with self.subTest(method=method, url=url):
                before = list(Asset.objects.values())
                response = getattr(self.client, method)(url, payload, format="json")
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
                self.assertEqual(list(Asset.objects.values()), before)

    def test_inaccessible_expired_and_missing_objects_cannot_be_changed(self):
        self.client.force_authenticate(user=self.owner)
        for asset_id in (self.unrelated.id, self.expired.id, "missing"):
            for method, suffix in (
                ("put", ""),
                ("patch", ""),
                ("delete", ""),
                ("post", "restore/"),
            ):
                with self.subTest(asset_id=asset_id, method=method):
                    before = list(Asset.objects.values())
                    response = getattr(self.client, method)(
                        f"/api/assets/{asset_id}/{suffix}",
                        {"title": "Changed"},
                        format="json",
                    )
                    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
                    self.assertEqual(list(Asset.objects.values()), before)
