import logging
from time import gmtime, strftime

from core.models import Asset
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.http import HttpResponseNotFound, JsonResponse
from django.shortcuts import render
from django.views.generic import TemplateView
from util.widget.asset.manager import AssetManager

logger = logging.getLogger("django")


class MediaImportView(TemplateView):
    @login_required
    def index(request):
        context = {
            "title": "Media Catalog",
            "js_resources": settings.JS_GROUPS["media"],
            "css_resources": settings.CSS_GROUPS["media"],
            "fonts": settings.FONTS_DEFAULT,
            "js_global_variables": {
                "MEDIA_URL": settings.URLS["MEDIA_URL"],
                "MEDIA_UPLOAD_URL": settings.URLS["MEDIA_UPLOAD_URL"],
            },
        }

        return render(request, "react.html", context)


class MediaRender:
    def index(request, asset_id, size="original"):
        try:
            asset = Asset.objects.get(id=asset_id)
            return asset.render(size)
        except Asset.DoesNotExist:
            logger.error(f"Asset: {asset_id} not found")
            return HttpResponseNotFound()


class MediaUpload:
    @login_required
    def index(request):
        # Validate uploads length - only realistically allow one uploaded file at a time
        if "file" not in request.FILES:
            return JsonResponse({"error": "No file uploaded"}, status=400)
        if len(request.FILES) > 1:
            return JsonResponse(
                {"error": "Only single-file uploads permitted"}, status=400
            )

        # Uploads are kind of pre-validated with controls in the media uploader
        #  on the front end, so these steps may actually be kind of redundant
        # Validate uploaded files
        uploaded_file = request.FILES["file"]

        # Validate file extension
        # TODO: PUT THIS IN SETTINGS
        allowed_extension = ["jpg", "jpeg", "png", "gif", "wav", "mp3", "obj", "m4a"]
        try:
            FileExtensionValidator(allowed_extension)(uploaded_file)
        except ValidationError:
            return JsonResponse(
                {"error": "Uploaded file's extension is not valid"}, status=400
            )

        # Validate file MIME type
        # TODO: PUT THESE IN SETTINGS, TOO
        image_mimetypes = ["image/jpg", "image/jpeg", "image/gif", "image/png"]
        audio_mimetypes = [
            "audio/mp3",
            "audio/mpeg",
            "audio/mpeg3",
            "audio/mp4",
            "audio/x-m4a",
            "audio/wave",
            "audio/wav",
            "audio/x-wav",
            "audio/m4a",
        ]
        video_mimetypes = []  # placeholder
        model_mimetypes = ["model/obj"]
        allowed_mime_types = (
            image_mimetypes + audio_mimetypes + video_mimetypes + model_mimetypes
        )
        if uploaded_file.content_type not in allowed_mime_types:
            return JsonResponse(
                {"error": "Uploaded file's content type is not valid"}, status=400
            )

        # Validate file size
        # approximately 20MB
        if uploaded_file.size > 20000000:
            return JsonResponse({"error": "Uploaded file is too large"}, status=400)

        # Make sure the user uploading the file hasn't hit their disk space limit
        if not AssetManager.user_has_space_for(request.user, uploaded_file.size):
            return JsonResponse(
                {"error": "User does not have enough space for uploaded file"},
                status=400,
            )

        try:
            asset = Asset.handle_uploaded_file(request.user, uploaded_file)

            upload_response = JsonResponse({"success": "true", "id": asset.id})
            # Make sure the file is not cached
            upload_response["Expires"] = "Mon, 26 Jul 1997 05:00:00 GMT"
            upload_response["Last-Modified"] = strftime("%z", gmtime())
            upload_response["Cache-Control"] = "no-store, no-cache, must-revalidate"
            upload_response["Pragma"] = "no-cache"
            upload_response.status_code = 200

            return upload_response
        except Exception:
            return JsonResponse({"error": "Error processing upload"}, status=500)
