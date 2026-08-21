import io
import tempfile

from api.serializers import SiteMessageSerializer
from api.tests.base import MateriaTestCase
from core.models import SiteImage, SiteMessage
from django.conf import settings
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase
from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient


class SiteImageViewSetTestCase(MateriaTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.regular_user = User.objects.create_user(
            username="regular_site",
            email="regular_site@example.com",
            password="testpass123",
        )

        cls.superuser = User.objects.create_superuser(
            username="admin_site",
            email="admin_site@example.com",
            password="testpass123",
        )

        cls.profile_image = SiteImage.objects.create(
            image_type=SiteImage.ImageType.PROFILE_IMAGE,
            image_path="/site_img/profile_seed.png",
        )
        cls.catalog_banner = SiteImage.objects.create(
            image_type=SiteImage.ImageType.CATALOG_BANNER,
            image_path="/site_img/banner_seed.png",
        )

    def setUp(self):
        self.client = APIClient()

    @staticmethod
    def make_uploaded_image(filename="test.png", size=(20, 20)):
        image_stream = io.BytesIO()
        image = Image.new("RGB", size, color=(73, 109, 137))
        image.save(image_stream, format="PNG")
        image_stream.seek(0)

        return SimpleUploadedFile(
            name=filename,
            content=image_stream.read(),
            content_type="image/png",
        )


class TestSiteImageList(SiteImageViewSetTestCase):
    def test_unauthenticated_can_list(self):
        response = self.client.get("/api/site-images/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = [item["id"] for item in response.data]
        self.assertIn(self.profile_image.id, returned_ids)
        self.assertIn(self.catalog_banner.id, returned_ids)

    def test_regular_user_can_list(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get("/api/site-images/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = [item["id"] for item in response.data]
        self.assertIn(self.profile_image.id, returned_ids)
        self.assertIn(self.catalog_banner.id, returned_ids)

    def test_superuser_can_list(self):
        self.client.force_authenticate(user=self.superuser)
        response = self.client.get("/api/site-images/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = [item["id"] for item in response.data]
        self.assertIn(self.profile_image.id, returned_ids)
        self.assertIn(self.catalog_banner.id, returned_ids)

    def test_list_can_filter_by_type(self):
        response = self.client.get(
            "/api/site-images/", {"type": SiteImage.ImageType.PROFILE_IMAGE}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)
        self.assertTrue(
            all(
                item["image_type"] == SiteImage.ImageType.PROFILE_IMAGE
                for item in response.data
            )
        )
        returned_ids = [item["id"] for item in response.data]
        self.assertIn(self.profile_image.id, returned_ids)
        self.assertNotIn(self.catalog_banner.id, returned_ids)


class TestSiteImageCreate(SiteImageViewSetTestCase):
    def setUp(self):
        super().setUp()

        self.temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp_dir.cleanup)

        self.original_site_images_dir = settings.DIRS.get("site_images")
        settings.DIRS["site_images"] = self.temp_dir.name
        self.addCleanup(self._restore_site_images_dir)

    def _restore_site_images_dir(self):
        if self.original_site_images_dir is None:
            settings.DIRS.pop("site_images", None)
        else:
            settings.DIRS["site_images"] = self.original_site_images_dir

    def test_superuser_can_create(self):
        self.client.force_authenticate(user=self.superuser)
        before_count = SiteImage.objects.count()

        payload = {
            "image_type": SiteImage.ImageType.PROFILE_IMAGE,
            "image": self.make_uploaded_image(),
        }
        response = self.client.post("/api/site-images/", payload, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(SiteImage.objects.count(), before_count + 1)

    def test_regular_user_cannot_create(self):
        self.client.force_authenticate(user=self.regular_user)
        before_count = SiteImage.objects.count()

        payload = {
            "image_type": SiteImage.ImageType.CATALOG_BANNER,
            "image": self.make_uploaded_image(filename="banner.png"),
        }
        response = self.client.post("/api/site-images/", payload, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(SiteImage.objects.count(), before_count)

    def test_unauthenticated_cannot_create(self):
        before_count = SiteImage.objects.count()

        payload = {
            "image_type": SiteImage.ImageType.CATALOG_BANNER,
            "image": self.make_uploaded_image(filename="banner_unauth.png"),
        }
        response = self.client.post("/api/site-images/", payload, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(SiteImage.objects.count(), before_count)


class TestSiteImageDestroy(SiteImageViewSetTestCase):
    def test_superuser_can_delete(self):
        target = SiteImage.objects.create(
            image_type=SiteImage.ImageType.CATALOG_BANNER,
            image_path="/site_img/delete_me.png",
        )
        self.client.force_authenticate(user=self.superuser)

        response = self.client.delete(f"/api/site-images/{target.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(SiteImage.objects.filter(id=target.id).exists())

    def test_non_privileged_user_cannot_delete(self):
        target = SiteImage.objects.create(
            image_type=SiteImage.ImageType.CATALOG_BANNER,
            image_path="/site_img/keep_me.png",
        )
        self.client.force_authenticate(user=self.regular_user)

        response = self.client.delete(f"/api/site-images/{target.id}/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(SiteImage.objects.filter(id=target.id).exists())


class SiteMessageSerializerTestCase(SimpleTestCase):
    def test_scheduled_message_keeps_dates(self):
        serializer = SiteMessageSerializer(
            data={
                "message_type": SiteMessage.MessageType.SITE_ALERT,
                "message_text": "Scheduled alert",
                "start_at": "2026-01-01T00:00:00Z",
                "end_at": "2026-01-02T00:00:00Z",
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertIsNotNone(serializer.validated_data["start_at"])
        self.assertIsNotNone(serializer.validated_data["end_at"])

    def test_non_scheduled_message_clears_dates_on_update(self):
        instance = SiteMessage(
            message_type=SiteMessage.MessageType.CATALOG_TEXT,
            message_text="Catalog text",
        )
        serializer = SiteMessageSerializer(
            instance=instance,
            data={
                "message_text": "Updated catalog text",
                "start_at": "2026-01-01T00:00:00Z",
                "end_at": "2026-01-02T00:00:00Z",
            },
            partial=True,
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertIsNone(serializer.validated_data["start_at"])
        self.assertIsNone(serializer.validated_data["end_at"])
