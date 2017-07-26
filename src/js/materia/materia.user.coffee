Namespace('Materia').User = do ->
	currentUser = null

	getCurrentUser = (callback) ->
		if currentUser?
			callback(currentUser)
		else
			# if we are unable to retrieve it then we need to pull it from the server:
			Materia.Coms.Json.send 'user_get', null, (user) ->
				currentUser = user
				callback(currentUser)

	getCurrentUser: getCurrentUser