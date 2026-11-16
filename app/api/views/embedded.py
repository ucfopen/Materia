from urllib.parse import urlsplit

from api.authentication import EmbeddedBearerAuthentication, EmbeddedGrant
from api.filters import visible_instances
from api.score_services import (
    can_resubmit_score,
    can_review_scores,
    resubmit_score,
    score_history,
    score_report,
)
from api.serializers import WidgetInstanceSerializer
from api.views.widget_instances import WidgetInstancePagination
from core.models import LogPlay, WidgetInstance
from core.services.perm_service import PermService
from core.services.widget_play_services import (
    WidgetPlayInitService,
    WidgetPlayValidationService,
)
from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from lti.services.auth import LTIAuthService
from lti_tool.models import LtiDeployment
from pylti1p3.deep_link import DeepLink
from pylti1p3.deep_link_resource import DeepLinkResource
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed, NotFound, PermissionDenied
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView


class EmbeddedPlayRequestSerializer(serializers.Serializer):
    instanceId = serializers.CharField()


@method_decorator(never_cache, name="dispatch")
class EmbeddedPlayView(APIView):
    # Guest initialization must ignore even a valid first-party session cookie.
    authentication_classes = [EmbeddedBearerAuthentication]
    http_method_names = ["post"]

    @transaction.atomic
    def post(self, request):
        if not settings.EMBEDDED_AUTH_ENABLED:
            raise NotFound()
        serializer = EmbeddedPlayRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = get_object_or_404(
            WidgetInstance.objects.select_for_update(),
            pk=serializer.validated_data["instanceId"],
            is_deleted=False,
        )
        grant = request.auth
        if not instance.guest_access and not isinstance(grant, EmbeddedGrant):
            raise AuthenticationFailed("Please relaunch this widget from your LMS.")
        context_id = grant.context_id if grant else ""
        validation = WidgetPlayValidationService.validate_widget_context(
            request,
            instance,
            has_guest_access=instance.guest_access,
            is_embedded=True,
            context_id=context_id,
        )
        if validation != WidgetPlayValidationService.VALID:
            messages = {
                WidgetPlayValidationService.INVALID_NOT_YET_OPEN: "This widget is currently closed.",
                WidgetPlayValidationService.INVALID_NO_ATTEMPTS: "You have no attempts remaining.",
                WidgetPlayValidationService.INVALID_DRAFT_NOT_PLAYABLE: "This widget is still a draft.",
                WidgetPlayValidationService.INVALID_RETIRED_WIDGET: "This widget is no longer playable.",
                WidgetPlayValidationService.VALID_WITH_PRE_EMBED: "Select Play to start this widget.",
            }
            raise PermissionDenied(
                messages.get(validation, "This widget is not playable.")
            )
        if instance.guest_access:
            play = WidgetPlayInitService.init_play(request, instance, None)
        else:
            play = WidgetPlayInitService.init_lti_play(
                request,
                instance,
                request.user,
                grant.launch_data,
                deployment_id=grant.deployment_id,
            )
        return Response(
            {
                "playId": play.id,
                "userId": play.user_id,
                "contextId": context_id or None,
                "width": instance.widget.width,
                "height": instance.widget.height,
            },
            status=201,
        )


@method_decorator(never_cache, name="dispatch")
class EmbeddedView(APIView):
    authentication_classes = [EmbeddedBearerAuthentication]
    permission_classes = [IsAuthenticated]

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Referrer-Policy"] = "no-referrer"
        return response


def review_plays(request):
    grant = request.auth
    instance = get_object_or_404(WidgetInstance, pk=grant.instance_id, is_deleted=False)
    plays = LogPlay.objects.filter(instance=instance)
    if grant.play_id:
        play = get_object_or_404(plays, pk=grant.play_id)
        if not can_review_scores(
            request.user, instance, play=play, launch_data=grant.launch_data
        ):
            raise PermissionDenied("You cannot view this score.")
        return plays.filter(pk=play.pk)
    return plays.filter(user=request.user, is_complete=True)


class EmbeddedContextView(EmbeddedView):
    http_method_names = ["get"]

    def get(self, request):
        grant = request.auth
        data = {
            "view": grant.purpose,
            "instanceId": grant.instance_id,
            "userId": request.user.pk,
            "contextId": grant.context_id,
            "isAuthor": LTIAuthService.is_user_course_author(grant.launch_data),
        }
        if grant.purpose == "instructor-resource":
            instance = get_object_or_404(WidgetInstance, pk=grant.instance_id)
            data.update(
                instance=WidgetInstanceSerializer(instance).data,
                provisionalAccess=grant.provisional_access,
                previewEmbedUrl=f"/preview-embed/{instance.pk}",
            )
        if grant.purpose == "scores":
            review_plays(request)
            data.update(playId=grant.play_id, isSingle=bool(grant.play_id))
        return Response(data)


def deep_link_instances(user):
    return (
        visible_instances(
            WidgetInstance.objects.select_related("widget").filter(is_deleted=False),
            user,
        )
        .distinct()
        .order_by("-created_at", "pk")
    )


class EmbeddedDeepLinkInstancesView(EmbeddedView):
    http_method_names = ["get"]

    def get(self, request):
        paginator = WidgetInstancePagination()
        page = paginator.paginate_queryset(deep_link_instances(request.user), request)
        return paginator.get_paginated_response(
            WidgetInstanceSerializer(page, many=True).data
        )


class EmbeddedDeepLinkSelectionView(EmbeddedView):
    http_method_names = ["post"]

    def post(self, request):
        serializer = EmbeddedPlayRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = get_object_or_404(
            deep_link_instances(request.user),
            pk=serializer.validated_data["instanceId"],
        )
        if instance.is_draft or instance.guest_access:
            raise PermissionDenied(
                "Only published, non-guest widgets can be embedded in LTI."
            )
        grant = request.auth
        dl_settings = grant.launch_data.get(
            "https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings", {}
        )
        return_url = dl_settings.get("deep_link_return_url")
        try:
            target = urlsplit(return_url or "")
        except ValueError as exc:
            raise PermissionDenied(
                "This launch has an invalid deep-link return URL."
            ) from exc
        if target.scheme not in {"https", "http"} or not target.netloc:
            raise PermissionDenied(
                "This launch has no valid deep-link return URL. Relaunch from your LMS."
            )
        if "ltiResourceLink" not in dl_settings.get("accept_types", []):
            raise PermissionDenied("This platform does not accept LTI resource links.")
        deployment = LtiDeployment.objects.select_related("registration").get(
            pk=grant.deployment_id
        )
        # Reconstruct signing state from the validated grant, not cookie-scoped launch cache.
        deep_link = DeepLink(
            deployment.registration.to_registration(),
            deployment.deployment_id,
            dl_settings,
        )
        resource = DeepLinkResource()
        resource.set_url(instance.embed_url)
        resource.set_title(f"{instance.name} Materia Widget")
        return Response(
            {"return_url": return_url, "JWT": deep_link.get_response_jwt([resource])}
        )


class EmbeddedScoresView(EmbeddedView):
    http_method_names = ["get"]

    def get(self, request):
        plays = review_plays(request)
        grant = request.auth
        if grant.play_id or request.query_params.get("play_id"):
            play = get_object_or_404(
                plays, pk=grant.play_id or request.query_params["play_id"]
            )
            if (
                grant.play_id
                and request.query_params.get("play_id", grant.play_id) != grant.play_id
            ):
                raise PermissionDenied("This launch does not allow that play.")
            data = score_report(play)
            if data["lti"] and not data["lti"]["is_legacy"]:
                data["lti"].update(
                    canResubmit=can_resubmit_score(request.user, play),
                    resubmit_url="/api/embedded/scores/resubmit/",
                    adminMode=PermService.is_superuser_or_elevated(request.user),
                )
            return Response(data)
        return Response(
            score_history(
                plays,
                WidgetInstance.objects.get(pk=grant.instance_id),
                request.user,
                grant.context_id,
            )
        )


class EmbeddedScoreResubmitView(EmbeddedView):
    http_method_names = ["post"]

    @transaction.atomic
    def post(self, request):
        grant = request.auth
        play = get_object_or_404(
            review_plays(request).select_for_update(),
            pk=grant.play_id or request.data.get("play_id"),
        )
        if (
            grant.play_id
            and request.data.get("play_id", grant.play_id) != grant.play_id
        ):
            raise PermissionDenied("This launch does not allow that play.")
        data, response_status = resubmit_score(request.user, play)
        return Response(data, status=response_status)
