from django.urls import path

from api.views.generation_api import GenerationApi

urlpatterns = [
    path("qset/", GenerationApi.generate_qset),
    path("from_prompt/", GenerationApi.generate_from_prompt),
]
