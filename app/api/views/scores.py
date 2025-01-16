import json

from django.core import serializers
from django.http import HttpResponseNotFound, HttpResponseForbidden, JsonResponse
from django.views import View

from core.models import DateRange, WidgetInstance, LogPlay, UserExtraAttempts
from util.widget.validator import ValidatorUtil


class ScoresApi:

    # Returns all scores for the given widget instance recorded by the current user, and attempts
    # remaining in the current context. If no launch token is supplied, the current semester will
    # be used as the current context.
    @staticmethod
    def get_scores_by_instance(request):
        # Get body params
        json_body = json.loads(request.body)
        instance_id = json_body.get("instanceId")
        token = json_body.get("token")

        # Verify body params
        if not instance_id or not ValidatorUtil.is_valid_hash(instance_id):
            return HttpResponseNotFound() # TODO: was Msg::invalid_input(instance_id)

        # Grab context ID
        context_id = None
        if token:
            result = "" # TODO: \Event::trigger('before_score_display', $token)
            if len(result) > 0:
                context_id = result
        else:
            session_context_id = False # TODO: \Session::get('context_id', false))
            if session_context_id:
                context_id = session_context_id

        semester = DateRange.objects.get(pk=5) # TODO

        # Get instance and validate user
        instance = WidgetInstance.objects.filter(pk=instance_id).first()
        if not instance:
            return HttpResponseNotFound()
        if not instance.playable_by_current_user():
            return HttpResponseForbidden() # TODO: was Msg::no_login()

        # Get scores and return
        scores = ScoresApi._get_instance_score_history(instance, context_id)
        attempts_used = len(ScoresApi._get_instance_score_history(instance, context_id, semester))
        extra = ScoresApi._get_instance_extra_attempts(instance, context_id, semester) if context_id else 0

        attempts_left = instance.attempts - attempts_used + extra

        return JsonResponse({
            'scores': scores,
            'attemptsLeft': attempts_left,
        })


    @staticmethod
    def get_scores_by_guest_instance(request):
        # Get and validate body
        json_body = json.loads(request.body)
        instance_id = json_body.get("instanceId")
        play_id = json_body.get("playId")

        if not instance_id or not ValidatorUtil.is_valid_hash(instance_id):
            return HttpResponseNotFound() # TODO: Was Msg::invalid_input(instance_id)

        # Get widget instance and validate user
        instance = WidgetInstance.objects.filter(pk=instance_id).first()
        if not instance:
            return HttpResponseNotFound()
        if not instance.playable_by_current_user():
            return HttpResponseForbidden() # TODO: was Msg::no_login

        scores = ScoresApi._get_guest_instance_score_history(instance, play_id)
        print(scores)
        json_scores = json.loads(serializers.serialize("json", [scores]))
        # TODO thrusday: fix serializing
        return JsonResponse({
            "scores": json_scores
        })


    @staticmethod
    def _get_instance_score_history(instance: WidgetInstance, context_id: str | None = None, semester: DateRange | None = None):
        # TODO select only id, created_at, percent - see php
        scores = LogPlay.objects.filter(
            is_complete=True,
            instance=instance,
            # TODO: user_id =
        ).order_by("-created_at")

        if context_id:
            scores = scores.filter(context_id=context_id)
        if semester:
            scores = scores.filter(semester=semester)

        return scores


    @staticmethod
    def _get_instance_extra_attempts(instance: WidgetInstance, context_id: str, semester: DateRange):
        # TODO select only extra_attempts - see php
        result = UserExtraAttempts.objects.filter(
            instance=instance,
            context_id=context_id,
            semester=semester.id, # TODO: model calls for id and not foreign key
            # TODO: user_id =
        ).first()

        return result.extra_attempts if result else 0


    @staticmethod
    def _get_guest_instance_score_history(instance: WidgetInstance, play_id: str):
        # TODO: I don't see the point of filtering by the other options? I think the PK should be just fine
        return LogPlay.objects.filter(
            pk=play_id,
            instance=instance,
            is_complete=True,
        ).order_by("-created_at")



