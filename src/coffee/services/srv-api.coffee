app = angular.module 'materia'
app.service 'apiServ', ->
	gatewayURL = API_LINK

	filterError = (data) ->
		showErorr(data) if data? && data.msg? && data.title? && data.type?

	showErorr = (data) ->
		if data.title == 'Invalid Login'
			# redirect to login page
			window.location = BASE_URL+"login"

	# public methods
	showErorr:showErorr
	filterError:filterError
