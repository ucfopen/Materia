import logging
from datetime import datetime

from core.models import LtiPlayState
from lti.services.launch import LTILaunchService

from .exceptions.ags_claim_not_defined import AGSClaimNotDefined
from .exceptions.ags_no_line_item import AGSNoLineItem
from .oauth import AGSOauth
from .request import AGSRequest
from .score_builder import AGSScoreBuilder

logger = logging.getLogger(__name__)


class AGSClient:
    """
    Client for abstracting AGS operations into straightforward instance methods
    Handles acquisition and rotation of access token from the current registration
    Handles user ID acquisition from launch data
    Exposes score builder for Scores service as well as certain Line Items operations
    """

    def __init__(self, play_state: LtiPlayState):
        self.play_state = play_state

        # raise an exception if an AGS claim was not defined in the launch data
        if not self.play_state.ags_line_item:
            raise AGSClaimNotDefined()

        registration = LTILaunchService.get_registration(self.play_state)

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
            self._user_id = self.play_state.ags_user_id
        return self._user_id

    def score_builder(self):
        return AGSScoreBuilder(self)

    def submit_score(self, score_data):

        iso_timestamp = datetime.fromtimestamp(score_data["timestamp"]).isoformat(
            timespec="milliseconds"
        )

        line_item = self.play_state.ags_line_item
        if line_item is None:
            raise AGSNoLineItem()

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
