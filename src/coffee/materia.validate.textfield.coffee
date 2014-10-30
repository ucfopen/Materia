Namespace('Materia.Validate').Textfield = do ->
	resctrict = (type, event) ->

		# Allow: backspace, delete, tab and escape Ctrl+A
		switch event.keyCode
			when 8,9,27,35,36,37,38
				return true
			when 65 # Ctrl+A
				return event.ctrlKey == true

		switch type
			when 'numeric'
				# Ensure that it is a number and stop the keypress
				return !(event.charCode < 48 || event.charCode > 57)
			when 'time'
				return !(event.charCode < 48 || event.charCode > 58)
		false

	numericOnly = (event) ->
		resctrict 'numeric', event

	timeOnly = (event) ->
		resctrict 'time', event

	numericOnly : numericOnly
	timeOnly : timeOnly