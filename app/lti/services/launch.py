import logging
import re

from core.message_exception import MsgNotFound
from core.models import LogPlay, Lti, LtiPlayState, WidgetInstance
from lti_tool.models import LtiDeployment, LtiLaunch, LtiRegistration
from lti_tool.utils import get_launch_from_request

# from pprint import pformat


logger = logging.getLogger(__name__)


class LTILaunchService:

    @staticmethod
    def register_association(launch, user, instance):
        """
        LTI associations were not really used in PHP Materia
        With LTI 1.3, we want to have a way to cross-reference resource link ids with instances
        There is some complexity associated with handling legacy LTI associations
        However, legacy associations enable us to back-reference previously embedded content
        """
        resource_link_1p1 = LTILaunchService.get_resource_link_1p1(launch)
        resource_link_1p3 = LTILaunchService.get_resource_link(launch)

        launch_deployment = LTILaunchService.get_deployment(launch)
        deployment = LtiDeployment.objects.get(deployment_id=launch_deployment)

        legacy_association = Lti.objects.filter(
            widget_instance=instance, resource_link=resource_link_1p1
        ).first()

        if legacy_association:
            """
            A legacy LTI 1.1 association already exists
            Upgrade the record to LTI 1.3 by replacing the 1p1 resource link

            TODO THIS REALLY NEEDS TESTING
            """
            legacy_association.deployment = deployment
            legacy_association.resource_link = resource_link_1p3
            legacy_association.lti_version = "1.3"
            legacy_association.consumer = None
            legacy_association.consumer_guid = None

            legacy_association.save()

        else:
            association_1p3 = Lti.objects.filter(
                widget_instance=instance, resource_link=resource_link_1p3
            ).first()
            if association_1p3:
                return association_1p3
            else:
                new_association = Lti(
                    widget_instance=instance,
                    resource_link=resource_link_1p3,
                    lti_version="1.3",
                    deployment=deployment,
                    user=user,
                    name=f"{user.first_name} {user.last_name}",
                    context_id=LTILaunchService.get_context_id(launch),
                    context_title=LTILaunchService.get_context_title(launch),
                )

                new_association.save()
            return new_association

    @staticmethod
    def get_resource_link(launch_data):
        resource_link_claim = launch_data.get(
            "https://purl.imsglobal.org/spec/lti/claim/resource_link", None
        )
        return (
            resource_link_claim.get("id", None)
            if resource_link_claim is not None
            else None
        )

    @staticmethod
    def get_resource_link_1p1(launch_data):
        lti_1p1_claim = launch_data.get(
            "https://purl.imsglobal.org/spec/lti/claim/lti1p1", None
        )
        return (
            lti_1p1_claim.get("resource_link_id", None)
            if lti_1p1_claim is not None
            else None
        )

    @staticmethod
    def get_deployment(play_state: LtiPlayState) -> LtiDeployment:
        return play_state.lti_association.deployment

    @staticmethod
    def get_registration(play_state: LtiPlayState) -> LtiRegistration:
        deployment = LTILaunchService.get_deployment(play_state)
        return deployment.registration if deployment is not None else None

    @staticmethod
    def get_launch_redirect(lti_launch: LtiLaunch) -> str:
        """
        Gets the appropriate redirect URI for resource link launches.
        Should be one of three destinations: post login, widget player, or score screen
        """
        launch_data = lti_launch.get_launch_data()
        uri_claim = launch_data.get(
            "https://purl.imsglobal.org/spec/lti/claim/target_link_uri"
        )

        # no redirect or a redirect to /ltilaunch? Send them to post-login
        if not uri_claim or re.search("/ltilaunch/", uri_claim):
            return "/lti/post_login/"

        # widget launches require special processing
        # we provide the launch ID as a query param so we can distinguish LTI plays from non-LTI
        # referencing request.lti_launch is NOT enough because one may be cached in session
        elif LTILaunchService.is_widget_launch(
            launch_data
        ) or LTILaunchService.is_legacy_widget_launch_url(uri_claim):

            if LTILaunchService.is_legacy_widget_launch_url(uri_claim):
                uri_claim = LTILaunchService.upgrade_widget_launch_url(uri_claim)

            lid = lti_launch.get_launch_id()
            uri_claim = f"{uri_claim}?lid={lid}"
            return uri_claim

        # expected to be a score screen at this point
        else:
            return uri_claim

    @staticmethod
    def get_inst_id_from_uri(uri_claim):

        res = re.search(
            r"(?:embed|play)/([A-Za-z0-9\-]{5,})/[A-Za-z0-9\-]*/?$", uri_claim
        )
        if res:
            return res.group(1)
        return None

    @staticmethod
    def is_widget_launch(launch_data) -> bool:
        """
        Identifies whether a given launch is a widget launch by inspecting the target_link_uri.
        """
        uri_claim = launch_data.get(
            "https://purl.imsglobal.org/spec/lti/claim/target_link_uri"
        )

        if re.search(r"(?:embed|play)/[A-Za-z0-9]{5,}/[A-Za-z0-9\-_]*/?$", uri_claim):
            return True

        return False

    @staticmethod
    def is_legacy_widget_launch_url(url: str) -> bool:
        """
        In the ancient days, LTI embeds used /lti/assignment?widget=inst_id as their URL
        Inspects the URL str and returns a boolean if this is indeed one of these legacy URLs
        """
        if re.search(r"lti/assignment/?\?widget=[A-Za-z0-9]{5,}$", url):
            return True
        return False

    @staticmethod
    def upgrade_widget_launch_url(url: str) -> str:
        """
        Upgrades a given launch URL from legacy to a modern embed URL.
        Returns a str representing the new embed URL.
        Raises a MsgNotFound if the instance associated with the ?widget= param no longer exists.
        """
        match = re.search(r"lti/assignment/?\?widget=([A-Za-z0-9]{5,})$", url)
        inst_id = match.group(1) if match else None
        if inst_id:
            inst = WidgetInstance.objects.get(id=inst_id)
            if inst:
                return inst.embed_url

        raise MsgNotFound(msg="No widget instance matches this request.")

    @staticmethod
    def is_lti_launch(request):
        if hasattr(request, "lti_launch") and request.lti_launch:
            return request.lti_launch.is_present
        return False

    @staticmethod
    def get_nonce(launch):
        return launch.get("nonce", None)

    @staticmethod
    def get_context_id(launch):
        context_claim = launch.get("https://purl.imsglobal.org/spec/lti/claim/context")
        return context_claim.get("id")

    @staticmethod
    def get_context_title(launch):
        context_claim = launch.get("https://purl.imsglobal.org/spec/lti/claim/context")
        return context_claim.get("title", "Untitled Context")

    @staticmethod
    def get_launch_state(launch):
        return launch.get("materia_launch_state", None)

    @staticmethod
    def is_initial_launch(request):
        launch_id = request.GET.get("lid", None)
        return launch_id is not None

    @staticmethod
    def is_recovery_launch(request):
        token_param = request.GET.get("token")
        return token_param is not None

    # @staticmethod
    # def get_recovery_launch(request):
    #     token_param = request.GET.get("token")
    #     if token_param is not None:
    #         return LtiPlayState.objects.filter(play_id=token_param)
    #     return None

    @staticmethod
    def get_launch_data_from_request(request):
        launch_id = request.GET.get("lid", None)
        if launch_id is not None:
            launch = get_launch_from_request(request, launch_id)
            launch_data = None if launch is None else launch.get_launch_data()
            return launch_data

    @staticmethod
    def get_or_recover_widget_launch(request):
        """
        Gets the launch data associated with a widget launch.
        Requires one of two query params to be present:
        lid: launch id. This is the uuid created by pylti1p3. Provided in initial resource launch.
        token: play id. Used to recover a launch that's already been put into session.
        """
        launch_id = request.GET.get("lid", None)
        if launch_id is not None:
            launch = get_launch_from_request(request, launch_id)
            launch_data = None if launch is None else launch.get_launch_data()
            launch_data["materia_launch_state"] = "INITIAL"
            return launch_data

        else:
            token_param = request.GET.get("token")
            if token_param is not None:
                recovery = LTILaunchService.get_launch_from_play(token_param)
                if recovery is not None:
                    recovery["materia_launch_state"] = "RECOVERY"

                return recovery

        return None

    @staticmethod
    def get_launch_from_play(play_id: str) -> LtiPlayState:
        play = LogPlay.objects.get(pk=play_id)
        if play:
            launch = LtiPlayState.objects.get(play_id=play.id)
            return launch

        return None

    # @staticmethod
    # def store_session_launch(request, key, launch):
    #     request.session[f"lti-launch-{key}"] = launch
    #     request.session.modified = True

    #     return key

    @staticmethod
    def get_session_launch(request, key):
        launch = request.session.get(f"lti-launch-{key}", None)
        return launch
