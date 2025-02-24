from django.urls import path, include

urlpatterns = [
    # Widgets
    path("widgets/", include("api.urls.widget_urls")),

    # Widget Instance
    path("widget_instances/", include("api.urls.widget_instance_urls")),

    # Sessions
    path("sessions/", include("api.urls.sessions_urls")),

    # Users
    path("user/", include("api.urls.user_urls")),

    # Notifications
    path("notifications/", include("api.urls.notifications_urls")),

    # Scores
    path("scores/", include("api.urls.scores_urls")),
]
