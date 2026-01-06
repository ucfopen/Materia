import logging
import re

from core.models import Lti
from lti_tool.models import LtiDeployment, LtiLaunch
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
    def get_deployment(launch_data):
        return launch_data.get(
            "https://purl.imsglobal.org/spec/lti/claim/deployment_id", None
        )

    @staticmethod
    def get_registration(launch_data):
        deployment_id = LTILaunchService.get_deployment(launch_data)
        deployment = LtiDeployment.objects.get(deployment_id=deployment_id)
        return deployment.registration if deployment is not None else None

    @staticmethod
    def get_launch_redirect(lti_launch: LtiLaunch):
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
        elif LTILaunchService.is_widget_launch(launch_data):
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
    def is_widget_launch(launch_data):
        """
        TODO how else can we determine whether it's a widget launch from LTI claim data?
        """
        uri_claim = launch_data.get(
            "https://purl.imsglobal.org/spec/lti/claim/target_link_uri"
        )

        if re.search(r"(?:embed|play)/[A-Za-z0-9]{5,}/[A-Za-z0-9\-]*/?$", uri_claim):
            return True

        return False

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
    def get_or_recover_widget_launch(request):
        """
        Gets the launch data associated with a widget launch.
        Requires one of two query params to be present:
        lid: launch id. This is the uuid created by pylti1p3. Provided in initial resource launch.
        token: play id. Used to recover a launch that's already been put into session.
        """
        if LTILaunchService.is_lti_launch(request):
            launch_id = request.GET.get("lid", None)
            if launch_id is not None:
                launch = get_launch_from_request(request, launch_id)
                launch_data = None if launch is None else launch.get_launch_data()
                launch_data["materia_launch_state"] = "INITIAL"
                return launch_data

            return None
        else:
            token_param = request.GET.get("token")
            recovery = LTILaunchService.get_session_launch(request, token_param)
            if recovery is not None:
                recovery["materia_launch_state"] = "RECOVERY"

            return recovery

    @staticmethod
    def store_session_launch(request, key, launch):
        request.session[f"lti-launch-{key}"] = launch
        request.session.modified = True

        return key

    @staticmethod
    def get_session_launch(request, key):
        launch = request.session.get(f"lti-launch-{key}", None)
        return launch
