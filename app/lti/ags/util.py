from django.conf import settings


class AGSUtil:

    @staticmethod
    def get_ags_user_id(launch_data):
        if settings.LTI_USERDATA.get("ags_claim"):
            user_id = launch_data.get(settings.LTI_USERDATA["ags_claim"]).get(
                settings.LTI_USERDATA["ags_identifier"]
            )
        else:
            user_id = launch_data.get(settings.LTI_USERDATA["ags_identifier"])

        return int(user_id)
