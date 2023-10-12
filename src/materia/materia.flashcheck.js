// Determines if Flash is installed and what version
Namespace('Materia').Flashcheck = (() => {
	let _flashVersionObj = null
	// Returns the flash version, false if not installed.
	const getFlashVersion = (callback) => {
		let return_val
		_flashVersionObj = swfobject.getFlashPlayerVersion()

		if (_flashVersionObj.major !== 0) {
			return_val = _flashVersionObj
		} else {
			return_val = false
		}

		if (callback != null) {
			callback(return_val)
		}
	}

	return { flashInstalled: getFlashVersion }
})()
