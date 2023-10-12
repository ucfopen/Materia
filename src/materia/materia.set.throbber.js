Namespace('Materia.Set').Throbber = (() => {
	const startSpin = (element, opts) => {
		if (typeof $ !== 'undefined' && $ !== null && $(element).spin != null) {
			$(element).spin(opts)
		}
	}

	const stopSpin = (element) => {
		if (typeof $ !== 'undefined' && $ !== null && $(element).spin != null) {
			$(element).spin(false)
		}
	}

	return {
		startSpin,
		stopSpin,
	}
})()
