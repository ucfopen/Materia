from django.urls import path

from api.views.scores_api import ScoresApi

urlpatterns = [
    path("get_for_widget_instance/", ScoresApi.get_for_widget_instance),
    path("get_for_widget_instance_guest/", ScoresApi.get_for_widget_instance_guest),
    path("get_play_details/", ScoresApi.get_play_details),
    path("get_score_summary/", ScoresApi.score_summary_get),
]
