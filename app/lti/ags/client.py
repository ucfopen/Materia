import logging
from datetime import datetime

from .oauth import AGSOauth
from .request import AGSRequest
from .services.line_items import AGSLineItemService
from .services.scores import AGSScoreBuilder
from .util import AGSUtil

logger = logging.getLogger("django")


class AGSClient:
    """
    Client for abstracting AGS operations into straightforward instance methods
    Handles acquisition and rotation of access token from the current registration
    Handles user ID acquisition from launch data
    Exposes score builder for Scores service and (@TODO) additional AGS functionality
    """

    def __init__(self, launch_data):
        self.launch_data = launch_data
        self._oauth = AGSOauth()
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

    def score_builder(self):
        return AGSScoreBuilder(self)

    def submit_score(self, score_data):

        iso_timestamp = datetime.fromtimestamp(score_data["timestamp"]).isoformat(
            timespec="milliseconds"
        )

        line_item = AGSLineItemService.get_from_launch(self.launch_data)
        url = f"{line_item}/scores"
        request = AGSRequest(self.access_token)

        body = {
            "userId": self.user_id,
            "activityProgress": score_data["activityProgress"],
            "gradingProgress": score_data["gradingProgress"],
            "timestamp": iso_timestamp,
            "scoreGiven": score_data["scoreGiven"],
            "scoreMaximum": score_data["scoreMaximum"],
        }

        fetch = request.post(url, body)
        return fetch
