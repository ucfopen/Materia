import logging

from django.shortcuts import redirect
from lti_tool.utils import get_launch_from_request
from pylti1p3.deep_link_resource import DeepLinkResource

# from pprint import pformat


logger = logging.getLogger("django")


# this isn't really a "view" - it's the endpoint for deep link content selection
# when content is selected and submitted from the client (via a form),
# the selection (an embed URL) is pulled from POST data, assembled into
# a DeepLinkResource, and then used to construct the deep link response.
# The response is another form that auto-submits to the platform's deep link return URL
# (Most of this abstracted via django-lti and pylti1p3 underneath)
def lti_deep_link_selection(request):
    selection = request.POST.get("instance")
    if not selection:
        # TODO this should probably redirect to a dedicated "LTI failure" view
        return redirect("/404")

    # notably, this request will NOT have an associated LTI launch
    # we have to grab the original LTI launch ID from session cache and then
    # use that to grab the original launch from DjangoCacheDataStorage
    cached_launch_id = request.session["lti-launch-id"]
    if not cached_launch_id:
        # TODO this should probably redirect to a dedicated "LTI failure view"
        return redirect("/404")

    cached_launch = get_launch_from_request(request, cached_launch_id)

    resource = DeepLinkResource()
    resource.set_url(selection).set_title("My Resource")

    response = cached_launch.deep_link_response([resource])

    return response
