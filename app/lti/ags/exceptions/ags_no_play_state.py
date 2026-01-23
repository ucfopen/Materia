class AGSNoPlayState(Exception):
    """
    An LtiPlayState record does not exist for this play.
    It may be a legacy play.
    """

    def __init__(self, message="The LTI play state is not available for this play."):
        super().__init__(message)
