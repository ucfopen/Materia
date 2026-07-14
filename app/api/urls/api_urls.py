from api.views import (
    assets,
    community_library,
    extra_attempts,
    generation,
    notifications,
    playsessions,
    playstorage,
    scores,
    sessions,
    site,
    users,
    widget_instances,
    widgets,
)
from api.views.lti import LtiWidgetInstancesInCourseView
from django.urls import include, path
from rest_framework import routers

router = routers.DefaultRouter()
router.register(r"assets", assets.AssetViewSet)
router.register(r"users", users.UserViewSet)
router.register(r"widgets", widgets.WidgetViewSet)
router.register(r"play-sessions", playsessions.PlaySessionViewSet)
router.register(r"storage", playstorage.PlayStorageViewSet)
router.register(
    r"instances", widget_instances.WidgetInstanceViewSet, basename="instances"
)
router.register(r"notifications", notifications.NotificationsViewSet)
router.register(r"extra-attempts", extra_attempts.UserExtraAttemptsViewSet)
router.register(r"site-images", site.SiteImageViewSet)
router.register(r"site-messages", site.SiteMessageViewSet)

urlpatterns = [
    path("", include(router.urls)),
    # Community Library
    path("community-library/", community_library.CommunityLibraryListView.as_view()),
    path(
        "community-library/tags/", community_library.CommunityLibraryTagsView.as_view()
    ),
    path(
        "community-library/<int:pk>/",
        community_library.CommunityLibraryDetailView.as_view(),
    ),
    path(
        "community-library/<int:pk>/copy/",
        community_library.CommunityLibraryCopyView.as_view(),
    ),
    path(
        "community-library/<int:pk>/like/",
        community_library.CommunityLibraryLikeView.as_view(),
    ),
    path(
        "community-library/<int:pk>/reports/",
        community_library.CommunityLibraryReportsView.as_view(),
    ),
    path(
        "community-library/<int:pk>/moderate/",
        community_library.CommunityLibraryModerateView.as_view(),
    ),
    path(
        "community-library/<int:pk>/snapshot_instance/<int:snapshot_id>/",
        community_library.CommunityLibrarySnapshotInstanceView.as_view(),
    ),
    path(
        "community-library/<int:pk>/snapshot_qset/<int:snapshot_id>/",
        community_library.CommunityLibrarySnapshotQsetView.as_view(),
    ),
    path("session/verify/", sessions.SessionView.as_view(), name="session-verify"),
    # User
    path("user/login/", users.UsersApi.service_user_login, name="service_user_login"),
    # Scores
    path("scores/", scores.ScoresView.as_view()),
    path("scores/details/", scores.ScoresDetailView.as_view()),
    # AI generation
    path("generate/qset/", generation.GenerateQsetView.as_view()),
    path("generate/from_prompt/", generation.GenerateFromPromptView.as_view()),
    path("lti/<slug:context_id>/instances/", LtiWidgetInstancesInCourseView.as_view()),
]
