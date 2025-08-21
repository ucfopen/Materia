from django.conf import settings
from lti.ags.request import AGSRequest

domain = settings.LTI_PLATFORM_DOMAIN


class AGSLineItemService:
    """
    AGS Line Items service
    Mostly placeholder (for now)
    TODO should be functionally similar to scores service instead of static methods?
    """

    @staticmethod
    def get_line_items_from_launch(launch):
        ags_claim = launch.get("https://purl.imsglobal.org/spec/lti-ags/claim/endpoint")
        if ags_claim:
            line_items = ags_claim.get("lineitems")
            return line_items

        return None

    @staticmethod
    def get_from_launch(launch):
        ags_claim = launch.get("https://purl.imsglobal.org/spec/lti-ags/claim/endpoint")
        if ags_claim:
            line_item = ags_claim.get("lineitem")
            return line_item

        return None

    @staticmethod
    def create():
        pass

    @staticmethod
    def update():
        pass

    @staticmethod
    def get(token, url):

        request = AGSRequest(token)
        fetch = request.get(url)
        return fetch

    @staticmethod
    def list():
        pass

    @staticmethod
    def delete():
        pass
