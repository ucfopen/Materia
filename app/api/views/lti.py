import logging

from core.message_exception import MsgFailure, MsgNotFound
from core.models import WidgetInstance
from core.serializers import LtiSerializer, WidgetInstanceSerializer
from lti.ags.client import AGSClient
from lti.services.launch import LTILaunchService
from rest_framework.response import Response
from rest_framework.views import APIView

# from pprint import pformat


logger = logging.getLogger("django")


class LtiWidgetInstancesInCourseView(APIView):

    def get(self, request, context_id):

        if not context_id:
            return MsgNotFound(msg="No context ID provided")

        launch = LTILaunchService.get_session_launch(request, context_id)
        if launch is None:
            return MsgNotFound(msg="Could not recover launch data")

        try:
            ags = AGSClient(launch)
            # grab line items for the given course context
            line_items = ags.line_items()

            if line_items and isinstance(line_items, list):

                # create a flat list of resource link ids from the list of line items
                resource_link_ids = [
                    item.get("resourceLinkId")
                    for item in line_items
                    if item.get("resourceLinkId")
                ]

                # get instance list via the LTI model relation
                instances = (
                    WidgetInstance.objects.filter(
                        lti_embeds__resource_link__in=resource_link_ids
                    )
                    .prefetch_related("lti_embeds")
                    .distinct()
                )

                serialized = WidgetInstanceSerializer(instances, many=True)
                serialized_data = serialized.data

                for i, instance in enumerate(instances):
                    # there are potentially multiple lti embeds per instance
                    lti_embeds = instance.lti_embeds.all()
                    if lti_embeds:
                        serialized_lti = LtiSerializer(lti_embeds, many=True).data
                        for lti_data in serialized_lti:

                            resource_link = lti_data.get("resource_link")
                            matching_line_item = next(
                                (
                                    item
                                    for item in line_items
                                    if item.get("resourceLinkId") == resource_link
                                ),
                                None,
                            )

                            if matching_line_item:
                                lti_data["lti_resource_name"] = matching_line_item.get(
                                    "label"
                                )

                        serialized_data[i]["lti_data"] = serialized_lti
                    else:
                        serialized_data[i]["lti_data"] = []

            return Response(serialized_data)

        except Exception as e:
            return MsgFailure(
                msg=f"Failed to generate instance list for this course context: {str(e)}"
            )
