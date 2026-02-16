from django.conf import settings


class AGSUtil:

    @staticmethod
    def list_line_items_from_launch(launch):
        ags_claim = launch.get("https://purl.imsglobal.org/spec/lti-ags/claim/endpoint")
        if ags_claim:
            line_items = ags_claim.get("lineitems")
            return line_items

        return None

    @staticmethod
    def get_line_item_from_launch(launch):
        ags_claim = launch.get("https://purl.imsglobal.org/spec/lti-ags/claim/endpoint")
        if ags_claim:
            line_item = ags_claim.get("lineitem")
            return line_item

        return None

    @staticmethod
    def get_ags_user_id(launch_data):
        if (
            settings.LTI_USERDATA.get("ags_claim")
            and launch_data.get(settings.LTI_USERDATA["ags_claim"]) is not None
        ):
            user_id = launch_data.get(settings.LTI_USERDATA["ags_claim"]).get(
                settings.LTI_USERDATA["ags_identifier"]
            )
        else:
            user_id = launch_data.get(settings.LTI_USERDATA["ags_identifier"])

        return int(user_id) if user_id is not None else None

    @staticmethod
    def is_ags_scoring_available(launch):
        ags_claim = launch.get("https://purl.imsglobal.org/spec/lti-ags/claim/endpoint")
        if ags_claim:
            scope = ags_claim.get("scope")
            if scope and "https://purl.imsglobal.org/spec/lti-ags/scope/score" in scope:
                return True

        return False
