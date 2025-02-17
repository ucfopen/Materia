from django.shortcuts import render
from .main import get_dark_mode

def profile(request):
    context = {
        "title": "Profile",
        "js_resources": ["dist/js/profile.js"],
        "css_resources": ["dist/css/profile.css"],
        **get_dark_mode(request),
    }
    return render(request, "react.html", context)


def settings(request):
    context = {
        "title": "Settings",
        "js_resources": ["dist/js/settings.js"],
        "css_resources": ["dist/css/settings.css"],
        **get_dark_mode(request),
    }
    return render(request, "react.html", context)




