from django.conf import settings
from django.shortcuts import render

def login(request):
    context = {
        "title": "Login",
        "js_resources": ["dist/js/login.js"],
        "css_resources": settings.CSS_GROUPS["login"],
        "fonts": settings.FONTS_DEFAULT
    }
    return render(request, "react.html", context)

