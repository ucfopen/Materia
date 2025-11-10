import logging
from datetime import datetime

from lti.services.launch import LTILaunchService

from .oauth import AGSOauth
from .request import AGSRequest
from .score_builder import AGSScoreBuilder
from .util import AGSUtil

logger = logging.getLogger("django")


class AGSClient:
    """
    Client for abstracting AGS operations into straightforward instance methods
    Handles acquisition and rotation of access token from the current registration
    Handles user ID acquisition from launch data
    Exposes score builder for Scores service as well as certain Line Items operations
    """

    def __init__(self, launch_data):
        self.launch_data = launch_data

        registration = LTILaunchService.get_registration(self.launch_data)

        self._oauth = AGSOauth(registration)
        self._access_token = None
        self._user_id = None

    @property
    def access_token(self):
        if not self._access_token:
            self._access_token = self._oauth.get_access_token()
        return self._access_token

    @property
    def user_id(self):
        if not self._user_id:
            self._user_id = AGSUtil.get_ags_user_id(self.launch_data)
        return self._user_id

    def line_items(self):
        line_items = AGSUtil.list_line_items_from_launch(self.launch_data)
        request = AGSRequest(self.access_token)

        fetch = request.get(line_items)
        return fetch

    def score_builder(self):
        return AGSScoreBuilder(self)

    def submit_score(self, score_data):

        iso_timestamp = datetime.fromtimestamp(score_data["timestamp"]).isoformat(
            timespec="milliseconds"
        )

        line_item = AGSUtil.get_line_item_from_launch(self.launch_data)
        url = f"{line_item}/scores"
        request = AGSRequest(self.access_token)

        body = {
            "userId": self.user_id,
            "activityProgress": score_data["activityProgress"],
            "gradingProgress": score_data["gradingProgress"],
            "timestamp": iso_timestamp,
            "scoreGiven": score_data["scoreGiven"],
            "scoreMaximum": score_data["scoreMaximum"],
            "https://canvas.instructure.com/lti/submission": {
                "new_submission": True,
                "preserve_score": False,
                "submission_type": "basic_lti_launch",
                "submission_data": score_data["submissionUrl"],
            },
        }

        fetch = request.post(url, body)
        return fetch
