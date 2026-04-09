import os

# JS group definition configs

JS_BASEURL = os.environ.get("JS_BASEURL", "dist/js/")

JS_GROUPS = {
    "main": [JS_BASEURL + "homepage.js"],
    "my-widgets": [JS_BASEURL + "my-widgets.js"],
    "help": [JS_BASEURL + "help.js"],
    "catalog": [JS_BASEURL + "catalog.js"],
    "community-library": [JS_BASEURL + "community-library.js"],
    "detail": [JS_BASEURL + "detail.js"],
    "player": [JS_BASEURL + "player-page.js"],
    "creator": [JS_BASEURL + "creator-page.js"],
    "login": [JS_BASEURL + "login.js"],
    "closed": [JS_BASEURL + "closed.js"],
    "draft-not-playable": [JS_BASEURL + "draft-not-playable.js"],
    "retired": [JS_BASEURL + "retired.js"],
    "profile": [JS_BASEURL + "profile.js"],
    "settings": [JS_BASEURL + "settings.js"],
    "scores": [JS_BASEURL + "scores.js"],
    "media": [JS_BASEURL + "media.js"],
    "widget_admin": [JS_BASEURL + "widget-admin.js"],
    "user_admin": [JS_BASEURL + "user-admin.js"],
    "instance_admin": [JS_BASEURL + "support.js"],
    "no-permission": [JS_BASEURL + "no-permission.js"],
    "no-attempts": [JS_BASEURL + "no-attempts.js"],
    "pre-embed": [JS_BASEURL + "pre-embed-placeholder.js"],
    "embedded-only": [JS_BASEURL + "embedded-only.js"],
    "post-login": [JS_BASEURL + "lti-post-login.js"],
    "select-item": [JS_BASEURL + "lti-select-item.js"],
    "open-preview": [JS_BASEURL + "lti-open-preview.js"],
    "lti-error": [JS_BASEURL + "lti-error.js"],
    "404": [JS_BASEURL + "404.js"],
    "500": [JS_BASEURL + "500.js"],
    "guides": [JS_BASEURL + "guides.js"],
    "qset-history": [JS_BASEURL + "qset-history.js"],
    "qset-generator": [JS_BASEURL + "qset-generator.js"],
}
