from django.conf import settings

media_urls = {
    "USE_CDN": settings.DRIVER_SETTINGS['s3']['use_cdn'], # Boolean to see if frontend should use CDN URL
    "CDN_URL": settings.DRIVER_SETTINGS['s3']['cdn_domain'], # CDN URL being passed in
}