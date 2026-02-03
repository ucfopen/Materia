from django.conf import settings
from core.utils.context_util import ContextUtil


class MediaUtil:
    @staticmethod
    def create(request) -> dict:
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

        return context