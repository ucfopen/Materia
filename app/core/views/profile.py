from django.conf import settings
from django.shortcuts import render
from django.views.generic import TemplateView

class ProfileView(TemplateView):
    def profile(request):
        context = {
            "title": "Profile",
            "js_resources": ["dist/js/profile.js"],
            "css_resources": settings.CSS_GROUPS["profile"],
            "fonts": settings.FONTS_DEFAULT
        }
        return render(request, "react.html", context)


    def settings(request):
        context = {
            "title": "Settings",
            "js_resources": ["dist/js/settings.js"],
            "css_resources": settings.CSS_GROUPS["settings"],
            "fonts": settings.FONTS_DEFAULT
        }
        return render(request, "react.html", context)




