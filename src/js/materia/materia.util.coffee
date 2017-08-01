Namespace('Materia').Util = do ->

	# Use for cross side scripting prevention.
	escapeUntrustedContent = (text) ->
		text
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot')
			.replace(/'/g, '&#x27')
			.replace(/\//g, '&#x2F')

	escapeUntrustedContent : escapeUntrustedContent