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

	get : get
	set : set
	grabCurrentUser : grabCurrentUser