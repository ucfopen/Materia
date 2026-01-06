import logging

from lti.views.lti import error_page
from lti_tool.utils import get_launch_from_request
from pylti1p3.deep_link_resource import DeepLinkResource

# from pprint import pformat


logger = logging.getLogger(__name__)


# this isn't really a "view" - it's the endpoint for deep link content selection
# when content is selected and submitted from the client (via a form),
# the selection (an embed URL) is pulled from POST data, assembled into
# a DeepLinkResource, and then used to construct the deep link response.
# The response is another form that auto-submits to the platform's deep link return URL
# (Most of this abstracted via django-lti and pylti1p3 underneath)
def lti_deep_link_selection(request):
    selection = request.POST.get("instance")
    title = request.POST.get("name", "Materia Widget Activity")
    launch_id = request.POST.get("lid", None)

    if not selection:
        return error_page(request, "error_unknown_assignment")

    # notably, this request will NOT have an associated LTI launch
    # the launch ID should be available from the form, as it is provided to the picker
    # as a backup, we can also check for it in session
    # once retrieved, we use the launch ID to grab the original launch from DjangoCacheDataStorage
    cached_launch_id = launch_id
    if cached_launch_id is None:
        try:
            cached_launch_id = request.session["lti-deep-link"]
        except Exception:
            logger.error(
                f"LTI: ERROR: cached launch ID could not be recovered for deep linking selection of inst: {selection}."
            )
            return error_page(request, "error_launch_recovery")

    try:
        cached_launch = get_launch_from_request(request, cached_launch_id)
        resource = DeepLinkResource()
        resource.set_url(selection).set_title(title)
        response = cached_launch.deep_link_response([resource])

    except Exception:
        logger.error(
            f"LTI: ERROR: could not recover cached launch with ID {cached_launch_id}."
        )
        return error_page(request, "error_launch_recovery")

    # Clear the deep link session data now that it's no longer needed
    if "lti-deep-link" in request.session:
        del request.session["lti-deep-link"]

    return response
