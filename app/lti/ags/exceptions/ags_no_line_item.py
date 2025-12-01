class AGSNoLineItem(Exception):
    """
    A Line Item does not exist in the AGS claim.
    This is most often due to a launch that is not associated with a gradebook entry.
    """

    def __init__(self, message="A Line Item does not exist in the AGS claim."):
        super().__init__(message)
