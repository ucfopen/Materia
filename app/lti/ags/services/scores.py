import logging

logger = logging.getLogger("django")


class AGSScoreBuilder:
    def __init__(self, client):
        self.client = client
        self.score_data = {}

    def score_given(self, score):
        self.score_data["scoreGiven"] = score
        return self

    def score_maximum(self, max_score):
        self.score_data["scoreMaximum"] = max_score
        return self

    def activity_progress(self, progress):
        self.score_data["activityProgress"] = progress
        return self

    def timestamp(self, timestamp):
        self.score_data["timestamp"] = timestamp
        return self

    def grading_progress(self, progress):
        self.score_data["gradingProgress"] = progress
        return self

    def submit(self):
        return self.client.submit_score(self.score_data)
