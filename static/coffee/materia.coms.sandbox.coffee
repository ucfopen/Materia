Namespace('Materia.Coms').Json = do ->
	_gatewayURL = ''

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
				showErorr data
			# continue to original callback
			callback data if callback?

		# send the request
		switch method
			when "widgets_get"
				callbackInterrupt widget_info
			when "session_valid"
				true
			when 'widget_instances_get'
				callbackInterrupt [widget_inst]
			when 'session_play_create'
				callbackInterrupt 'FFJFPPgWlWQVXxrfc1z5HNFWURZdXZVWHVodVg3S19nUUUwZjlOWElhQllubDQycTRLTGxlTTdIV2M'
			when 'question_set_get'
				callbackInterrupt demo_qset
			when 'play_logs_save'
				true
			when 'play_storage_data_save'
				true
			

	showErorr = (data) ->
		if data.title == 'Invalid Login'
			# redirect to login page
			window.location = BASE_URL+"login"
	
	# return true if jsonResult is an error object
	isError = (jsonResult) ->
		jsonResult? && typeof jsonResult.errorID != 'undefined'

	# public vars
	send:send
	isError: isError
	setGateway:setGateway