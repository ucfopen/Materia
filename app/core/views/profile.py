from django.shortcuts import render

def profile(request):
    context = {
        "title": "Profile",
        "js_resources": ["dist/js/profile.js"],
        "css_resources": ["dist/css/profile.css"],
    }
    return render(request, "react.html", context)

