# TODO: rip out redundant methods
app = angular.module 'materia'
app.service 'userServ', ($q, $rootScope) ->

	_me = null

	buildUser = (name = '', avatar = '', loggedIn = false, role = 'Student', notify = false) ->
		name: name
		avatar: avatar
		loggedIn: loggedIn
		role: role
		notify: notify

	getCurrentUserFromDom = ->
		user = document.getElementById('current-user')
		userData =
			name: user.getAttribute("data-name")
			avatar: user.getAttribute("data-avatar")
			loggedIn: user.getAttribute("data-logged-in")
			role: user.getAttribute("data-role")
			notify: user.getAttribute("data-notify")
		buildUser userData.name, userData.avatar, userData.loggedIn == 'true', userData.role, userData.notify == 'true'

	getAvatar = (user, size = 24) ->
		user.avatar.replace(/s=\d+/, "s=#{size}").replace(/size=\d+x\d+/, "size=#{size}x#{size}")

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
		getAvatar _me, size

	_user = null

	get = ->
		deferred = $q.defer()

		if !_user
			deferred.resolve grabCurrentUser()
		else
			deferred.resolve _user

		deferred.promise

	set = (userToSet) ->
		_user = userToSet
		$rootScope.$broadcast 'user.update'

	grabCurrentUser = ->
		Materia.User.getCurrentUser (user) ->
			set user
			user

	checkValidSession = (role) ->
		deferred = $q.defer()

		Materia.Coms.Json.send 'session_author_verify', [role], (data) ->
			deferred.resolve data

		deferred.promise


	# return public method references
	getCurrentUser : getCurrentUser
	getCurrentUserAvatar: getCurrentUserAvatar
	getAvatar : getAvatar
	updateSettings:updateSettings
	get : get
	set : set
	grabCurrentUser : grabCurrentUser
	checkValidSession : checkValidSession

