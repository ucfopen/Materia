import logging
from time import gmtime, strftime

from core.models import Asset
from core.services.asset_service import AssetService
from core.utils.context_util import ContextUtil
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.http import HttpResponseNotFound, JsonResponse
from django.shortcuts import render
from django.views.generic import TemplateView

logger = logging.getLogger(__name__)


class MediaImportView(TemplateView):
    @login_required
    def index(request):
        context = ContextUtil.create(
            title="Media Catalog",
            js_resources=settings.JS_GROUPS["media"],
            css_resources=settings.CSS_GROUPS["media"],
            request=request,
            js_globals={
                "MEDIA_URL": settings.URLS["MEDIA_URL"],
                "MEDIA_UPLOAD_URL": settings.URLS["MEDIA_UPLOAD_URL"],
                "USE_CDN": settings.DRIVER_SETTINGS['s3']['use_cdn'], # Boolean to see if frontend should use CDN URL
                "CDN_URL": settings.DRIVER_SETTINGS['s3']['cdn_domain'], # CDN URL being passed in
            },
        )

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
        try:
            FileExtensionValidator(settings.ALLOWED_EXTENSIONS)(uploaded_file)
        except ValidationError:
            return JsonResponse(
                {"error": "Uploaded file's extension is not valid"}, status=400
            )

        # Validate file MIME type
        allowed_mime_types = (
            settings.IMAGE_MIMETYPES
            + settings.AUDIO_MIMETYPES
            + settings.VIDEO_MIMETYPES
            + settings.MODEL_MIMETYPES
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
        if not AssetService.user_has_space_for(request.user, uploaded_file.size):
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

            asset.permissions.create(user=request.user, permission="full")

            return upload_response
        except Exception:
            return JsonResponse({"error": "Error processing upload"}, status=500)
