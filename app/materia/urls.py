"""
URL configuration for materia project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from core.views import main as core_views
from core.views.catalog import CatalogView
from core.views import profile as profile_views
from django.urls import include, path

urlpatterns = [
    path("", core_views.index, name="home page"),
    path("help/", core_views.help, name="help"),
    path("widgets/", CatalogView.index, name="widget catalog"),
    path("api/json/", include("api.urls.json")),
    path("profile/", profile_views.profile, name="profile"),
]

handler404 = "core.views.main.handler404"
handler500 = "core.views.main.handler500"
