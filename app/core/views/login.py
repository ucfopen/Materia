from django.shortcuts import render

def login(request):
    context = {
        "title": "Login",
        "js_resources": ["dist/js/login.js"],
        "css_resources": ["dist/css/login.css"],
    }
    return render(request, "react.html", context)

