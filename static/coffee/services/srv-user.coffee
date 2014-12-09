MyWidgets = angular.module 'MyWidgets'
MyWidgets.service 'userSrv', ($rootScope, $q) ->

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

		Materia.Coms.Json.send 'session_valid', [role], (data) ->
			console.log data

			deferred.resolve data

		deferred.promise

	get : get
	set : set
	grabCurrentUser : grabCurrentUser
	checkValidSession : checkValidSession