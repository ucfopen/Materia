Namespace('Materia.Coms').Json = do ->
	_gatewayURL = null

	setGateway = (newGateway) ->
		_gatewayURL = newGateway

	send = (method, args, callback, ignoreError) ->
		unless _gatewayURL? then _gatewayURL = API_LINK
		callback = $.noop() if !callback?
		args = [] if !args?

		# prepare the callback interrupt
		callbackInterrupt = (data) ->
			# show errors if they exist
			if ignoreError? && data? && data.msg? && data.title? && data.type?
				showError data
			# continue to original callback
			callback data if callback?

		# send the request
		$.post(_gatewayURL+method+"/", {data:JSON.stringify(args)}, callbackInterrupt, 'json')

	showError = (data) ->
		if data.title == 'Invalid Login'
			# redirect to login page
			window.location = BASE_URL+"login"

	# return true if jsonResult is an error object
	isError = (jsonResult) ->
		jsonResult? && typeof jsonResult.errorID != 'undefined'

	# public methods
	send:send
	isError: isError
	setGateway:setGateway