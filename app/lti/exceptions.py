class LTIAuthException(Exception):
    """
    Materia could not authenticate the user with the provided user data
    """

    def __init__(self, message="Critical LTI auth data (email or login id) missing."):
        super().__init__(message)


class LTIMissingAssignment(Exception):
    """
    Materia could not locate a valid widget instance based on launch request data
    """

    def __init__(
        self, message="A valid widget could not be located with LTI launch data."
    ):
        super().__init__(message)
