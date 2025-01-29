import json

from django.core import serializers
from django.http import HttpResponseNotFound, HttpResponseForbidden, JsonResponse, HttpResponseBadRequest

from core.models import DateRange, WidgetInstance
from util.logging.session_play import SessionPlay
from util.scoring.scoring_util import ScoringUtil
from util.widget.validator import ValidatorUtil


class ScoresApi:

    # Returns all scores for the given widget instance recorded by the current user, and attempts
    # remaining in the current context. If no launch token is supplied, the current semester will
    # be used as the current context.
    @staticmethod
    def widget_instance_scores_get(request):
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
        scores = ScoringUtil.get_instance_score_history(instance, context_id)
        attempts_used = len(ScoringUtil.get_instance_score_history(instance, context_id, semester))
        extra = ScoringUtil.get_instance_extra_attempts(instance, context_id, semester) if context_id else 0

        attempts_left = instance.attempts - attempts_used + extra

        return JsonResponse({
            'scores': scores,
            'attemptsLeft': attempts_left,
        })


    @staticmethod
    def guest_widget_instance_scores_get(request):
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

        scores = ScoringUtil.get_guest_instance_score_history(instance, play_id)
        # TODO: better serializing
        json_scores = json.loads(serializers.serialize("json", scores))
        fixed_json_scores = []
        for json_score in json_scores:
            fixed_json_scores.append(json_score["fields"])

        return JsonResponse({
            "scores": fixed_json_scores
        })


    @staticmethod
    def widget_instance_play_scores_get(request):
        # Get body params
        json_body = json.loads(request.body)
        play_id = json_body.get("playId")
        preview_inst_id = json_body.get("previewInstId")

        # Grab play details
        if preview_inst_id:
            # Check if preview is valid and user has access
            if not ValidatorUtil.is_valid_hash(preview_inst_id):
                return HttpResponseBadRequest # TODO: better error reporting
            if False:  # TODO: \Service_User::verify_session() !== true
                return HttpResponseForbidden() # TODO was Msg::no_login()

            # TODO: look at php
        else:
            # Check if session play is valid and user has access
            session_play = SessionPlay.get_or_none(play_id)
            if not session_play:
                return HttpResponseNotFound() # TODO better error reporting
            if not session_play.data.instance.playable_by_current_user():
                return HttpResponseForbidden() # TODO was Msg::no_login()

            return JsonResponse(ScoringUtil.get_play_details(session_play))


    # Gets score distributions (total and by semester) for a widget instance.
    @staticmethod
    def score_summary_get(request):
        # Get and validate body params
        json_body = json.loads(request.body)
        instance_id = json_body.get("instanceId")
        include_storage_data = json_body.get("includeStorageData", False)
        if not ValidatorUtil.is_valid_hash(instance_id):
            return HttpResponseNotFound() # TODO: was msg::invalid_input

        # Get widget instance and verify playable by user
        instance = WidgetInstance.objects.filter(pk=instance_id).first()
        if not instance:
            return HttpResponseNotFound()
        if not instance.playable_by_current_user():
            return HttpResponseForbidden()  # TODO was msg::no_login

        # Get the score distributions and summaries per semester
        # TODO: these 2 queries seem to be slow (up to 3sec in php!) - maybe they'll perform faster in
        #       python, but it seems like we can squash this into 1 (tho rather lengthy) query. these 2
        #       functions aren't being called anywhere else in PHP, only by this API endpoint.
        distribution = ScoringUtil.get_widget_score_distribution(instance)
        summaries = ScoringUtil.get_widget_score_summary(instance)

        # Combine both data
        for dist_id, data in distribution.items():
            if dist_id not in summaries:
                summaries[dist_id] = distribution
            else:
                summaries[dist_id]["distribution"] = data["distribution"]

        # TODO: include storage data

        # Transform into just a list of data, rather than a dict. Sort by semester ID.
        summaries = summaries.values()
        summaries = sorted(summaries, key=lambda k: k["id"])

        return JsonResponse({
            "summaries": summaries
        })
