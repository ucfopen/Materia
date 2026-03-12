import logging

import requests

logger = logging.getLogger(__name__)


class AGSRequest:

    def __init__(self, access_token):

        self.access_token = access_token

    def headers(self):
        # Note: user-agent header is required by Canvas.
        # we use PyLTI1p3-client since that's the user-agent provided by pylti1p3 for
        # other LMS-directed requests under the hood
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
            "User-Agent": "PyLTI1p3-client",
        }

        return headers

    def get(self, url):

        response = requests.get(url, headers=self.headers())
        body = response.json()
        response.raise_for_status()

        return body

    def post(self, url, body):
        response = requests.post(url, json=body, headers=self.headers())
        body = response.json()
        response.raise_for_status()

        return body

    def put(self):
        pass

    def delete(self):
        pass
