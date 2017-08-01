Namespace('Materia.Set').Throbber = do ->
	
	startSpin = (element, opts) ->
		if $? and $(element).spin?
			$(element).spin opts

	stopSpin = (element) ->
		if $? and $(element).spin?
			$(element).spin false

	startSpin : startSpin
	stopSpin : stopSpin
