# CSS group definition configs

CSS_BASEURL = "dist/css/"
FONTS_BASEURL = "https://fonts.googleapis.com/"

FONTS_DEFAULT = [
    FONTS_BASEURL + "css2?family=Kameron:wght@700&display=block",
    FONTS_BASEURL
    + "css2?family=Lato:ital,wght@0,300;0,400;0,700;0,900;1,700&display=block",
]

CSS_GROUPS = {
    "main": [CSS_BASEURL + "homepage.css"],
    "my-widgets": [CSS_BASEURL + "my-widgets.css"],
    "help": [CSS_BASEURL + "help.css"],
    "catalog": [CSS_BASEURL + "catalog.css"],
    "detail": [CSS_BASEURL + "detail.css"],
    "player": [CSS_BASEURL + "player-page.css"],
    "login": [CSS_BASEURL + "login.css"],
    "profile": [CSS_BASEURL + "profile.css"],
    "settings": [CSS_BASEURL + "settings.css"],
    "scores": [CSS_BASEURL + "scores.css"],
    "media": [CSS_BASEURL + "media.css"],
    "no-permission": [CSS_BASEURL + "no-permission.css"],
    "pre-embed": [CSS_BASEURL + "pre-embed-placeholder.css"],
}
