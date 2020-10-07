Namespace('Materia.Validate').Textfield = (() => {
	const resctrict = (type, event) => {
		// Allow: backspace, delete, tab and escape Ctrl+A
		switch (event.keyCode) {
			case 8:
			case 9:
			case 27:
			case 35:
			case 36:
			case 37:
			case 38:
				return true
			case 65: // Ctrl+A
				return event.ctrlKey === true
		}

		switch (type) {
			case 'numeric':
				// Ensure that it is a number and stop the keypress
				return !(event.charCode < 48 || event.charCode > 57)
			case 'time':
				return !(event.charCode < 48 || event.charCode > 58)
		}

		return false
	}

	const numericOnly = (event) => resctrict('numeric', event)

	const timeOnly = (event) => resctrict('time', event)

	return {
		numericOnly,
		timeOnly,
	}
})()
