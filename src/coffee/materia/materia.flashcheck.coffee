# Determines if Flash is installed and what version
Namespace('Materia').Flashcheck = do ->
	_flashVersionObj = null
	# Returns the flash version, false if not installed.
	getFlashVersion = (callback) ->
		_flashVersionObj = swfobject.getFlashPlayerVersion()

		if _flashVersionObj.major != 0
			return_val = _flashVersionObj
		else
			return_val = false

		callback return_val if callback?


	flashInstalled : getFlashVersion
