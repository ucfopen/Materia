class AGSClaimNotDefined(Exception):
    """An AGS claim does not exist"""

    def __init__(self, message="An AGS claim was not defined."):
        super().__init__(message)
