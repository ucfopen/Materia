import os

# CSS group definition configs

CSS_BASEURL = os.environ.get("CSS_BASEURL", "dist/css/")

CSS_GROUPS = {
    "main": [CSS_BASEURL + "homepage.css"],
    "my-widgets": [CSS_BASEURL + "my-widgets.css"],
    "help": [CSS_BASEURL + "help.css"],
    "catalog": [CSS_BASEURL + "catalog.css"],
    "community-library": [CSS_BASEURL + "community-library.css"],
    "detail": [CSS_BASEURL + "detail.css"],
    "player": [CSS_BASEURL + "player-page.css"],
    "creator": [CSS_BASEURL + "creator-page.css"],
    "login": [CSS_BASEURL + "login.css"],
    "profile": [CSS_BASEURL + "profile.css"],
    "settings": [CSS_BASEURL + "settings.css"],
    "scores": [CSS_BASEURL + "scores.css"],
    "media": [CSS_BASEURL + "media.css"],
    "support": [CSS_BASEURL + "support.css"],
    "user_admin": [CSS_BASEURL + "user-admin.css"],
    "no-permission": [CSS_BASEURL + "no-permission.css"],
    "pre-embed": [CSS_BASEURL + "pre-embed-placeholder.css"],
    "lti": [
        CSS_BASEURL + "lti.css",
        CSS_BASEURL + "lti-select-item.css",
        CSS_BASEURL + "lti-error.css",
    ],
    "404": [CSS_BASEURL + "404.css"],
    "500": [CSS_BASEURL + "500.css"],
    "guides": [CSS_BASEURL + "guides.css"],
    "qset-history": [CSS_BASEURL + "qset-history.css"],
    "qset-generator": [CSS_BASEURL + "qset-generator.css"],
}
