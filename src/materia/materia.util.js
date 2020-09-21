Namespace('Materia').Util = (() => {
	// Use for cross side scripting prevention.
	const escapeUntrustedContent = (text) =>
		text
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot')
			.replace(/'/g, '&#x27')
			.replace(/\//g, '&#x2F')

	return { escapeUntrustedContent }
})()
