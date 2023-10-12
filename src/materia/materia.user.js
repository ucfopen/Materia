Namespace('Materia').User = (() => {
	let currentUser = null

	const getCurrentUser = (callback) => {
		if (currentUser != null) {
			callback(currentUser)
		} else {
			// if we are unable to retrieve it then we need to pull it from the server:
			Materia.Coms.Json.send('user_get', null).then((user) => {
				currentUser = user
				callback(currentUser)
			})
		}
	}

	return { getCurrentUser }
})()
