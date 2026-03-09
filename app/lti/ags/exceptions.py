class AGSClaimNotDefined(Exception):
    """
    An AGS claim does not exist
    """

    def __init__(self, message="An AGS claim was not defined."):
        super().__init__(message)


class AGSNoLineItem(Exception):
    """
    A Line Item does not exist in the AGS claim.
    This is most often due to a launch that is not associated with a gradebook entry.
    """

    def __init__(self, message="A Line Item does not exist in the AGS claim."):
        super().__init__(message)


class AGSNoPlayState(Exception):
    """
    An LtiPlayState record does not exist for this play.
    It may be a legacy play.
    """

    def __init__(self, message="The LTI play state is not available for this play."):
        super().__init__(message)
