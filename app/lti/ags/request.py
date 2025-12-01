import logging

import requests

logger = logging.getLogger("django")


class AGSRequest:

    def __init__(self, access_token):

        self.access_token = access_token

    def headers(self):
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
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
