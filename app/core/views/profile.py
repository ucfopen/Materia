from django.conf import settings as djangoSettings
from django.shortcuts import render

def profile(request):
    context = {
        "title": "Profile",
        "js_resources": djangoSettings.JS_GROUPS["profile"],
        "css_resources": djangoSettings.CSS_GROUPS["profile"],
    }
    return render(request, "react.html", context)


def settings(request):
    context = {
        "title": "Settings",
        "js_resources": djangoSettings.JS_GROUPS["settings"],
        "css_resources": djangoSettings.CSS_GROUPS["settings"],
    }
    return render(request, "react.html", context)




