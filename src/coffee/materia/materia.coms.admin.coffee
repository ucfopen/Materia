Namespace('Materia.Coms').Admin = do ->
	_gatewayURL = null

	setGateway = (newGateway) ->
		_gatewayURL = newGateway

	send = (type, method, args, callback, ignoreError) ->
		unless _gatewayURL? then _gatewayURL = API_LINK
		callback = new Function() if !callback?
		args = [] if !args?

		# prepare the callback interrupt
		callbackInterrupt = (data) ->
			# show errors if they exist
			if ignoreError? && data? && data.msg? && data.title? && data.type?
				showError data
			# continue to original callback
			callback data if callback?

		# build a new request
		req = new XMLHttpRequest()

		url = _gatewayURL+method+'/'
		if type is 'GET'
			url += '?data='+JSON.stringify(args)

		payload = {}
		if type is 'POST'
			payload = 'data='+JSON.stringify(args)

		req.onreadystatechange = ->
			if req.readyState == XMLHttpRequest.DONE
				if req.status == 200
					callbackInterrupt JSON.parse(req.responseText)
				if req.status == 204
					callbackInterrupt null
		req.open type, url
		req.setRequestHeader 'Accept', 'application/json, text/javascript, */*;'
		req.setRequestHeader 'Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8'
		req.setRequestHeader 'X-Requested-With', 'XMLHttpRequest'
		req.send payload

	showError = (data) ->
		if data.title == 'Invalid Login'
			# redirect to login page
			window.location = BASE_URL+"login"

	formatGetVars = (vars) ->
		return Object
			.keys(vars)
			.map (key) ->
				return key+'='+vars[key]
			.join('&')

	# public methods
	send:send
	setGateway:setGateway