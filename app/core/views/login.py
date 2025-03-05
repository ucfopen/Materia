from django.conf import settings
from django.shortcuts import render
from .main import get_dark_mode

def login(request):
    context = {
        "title": "Login",
        "js_resources": ["dist/js/login.js"],
        "css_resources": settings.CSS_GROUPS["login"],
        "fonts": settings.FONTS_DEFAULT,
        **get_dark_mode(request),
    }
    return render(request, "react.html", context)

