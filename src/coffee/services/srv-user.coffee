app = angular.module 'materia'
app.service 'userServ', [ ->

	_me = null

	buildUser = (name = '', avatar = '', loggedIn = false, role = 'Student', notify = false, beardMode = false) ->
		name: name
		avatar: avatar
		loggedIn: loggedIn
		role: role
		notify: notify
		beardMode: beardMode

	getCurrentUserFromDom = ->
		userData = document.getElementById('current-user').dataset
		buildUser userData.name, userData.avatar, userData.loggedIn == 'true', userData.role, userData.notify == 'true', userData.beardMode == 'true'

	getCurrentUserFromAPI = (callback) ->

		Materia.User.getCurrentUser (user) ->

	updateSettings = (property, value) ->
		_me[property] = value

	getCurrentUser = (from = 'dom') =>
		if not _me?
			switch from
				when 'dom'
					_me = getCurrentUserFromDom()
				else
					_me = buildUser()
		_me

	getCurrentUserAvatar = (size = 24) ->
		_me.avatar.replace(/s=\d+/, "s=#{size}").replace(/size=\d+x\d+/, "size=#{size}x#{size}")

	# return public method references
	getCurrentUser : getCurrentUser
	getCurrentUserAvatar: getCurrentUserAvatar
	updateSettings:updateSettings

]
