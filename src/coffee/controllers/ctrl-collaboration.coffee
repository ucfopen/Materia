# The collaboration modal on the My Widgets page
app.controller 'CollaborationController', ($scope, selectedWidgetSrv, widgetSrv) ->
	$scope.search = (nameOrFragment) ->
		$scope.searching = true

		inputArray = nameOrFragment.split(',')
		nameOrFragment = inputArray[inputArray.length - 1]

		if(nameOrFragment.length < 1)
			stopSpin()
			return
		Materia.Coms.Json.send 'users_search', [nameOrFragment], (matches) ->
			if(matches == null || typeof matches == 'undefined' || matches.length < 1)
				$scope.searchResults = []
				stopSpin()
				return

			for user in matches
				user.gravatar = $scope.$parent.getGravatar(user.email)
			$scope.searchResults = matches
			$scope.$apply()

	$scope.searchMatchClick = (user) ->
		$scope.searching = false

		# Do not add duplicates
		for existing_user in $scope.$parent.collaborators
			if user.id == existing_user.id
				return

		$scope.$parent.collaborators.push
			id: user.id
			isCurrentUser: user.isCurrentUser
			expires: null
			expiresText: "Never"
			first: user.first
			last: user.last
			gravatar: user.gravatar
			access: 0

		setTimeout ->
			$scope.$parent.setupPickers()
		, 1

	$scope.removeAccess = (user) ->
		user.remove = true

	$scope.updatePermissions = ->
		that = this.$parent
		users = that.collaborators

		permObj = []
		user_ids = {}

		for user in users
			# Do not allow saving if a demotion dialog is on the screen
			if user.warning
				return

			access = []
			for i in [0...user.access]
				access.push null

			access.push if user.remove then false else true
			if user.isCurrentUser and user.remove
				widgetSrv.removeWidget($scope.$parent.selectedWidget.id)

			user_ids[user.id] = [user.access, user.expires]
			permObj.push
				user_id: user.id
				expiration: user.expires
				perms: access

		$scope.$parent.perms.widget = user_ids
		Materia.Coms.Json.send 'permissions_set', [0,$scope.$parent.selectedWidget.id,permObj], (returnData) ->
			if returnData == true
				that.hideModal()
			else
				alert(returnData.msg)
			$scope.$apply()

	$scope.checkForWarning = (user) ->
		if user.isCurrentUser and user.access < 30
			user.warning = true

	$scope.cancelDemote = (user) ->
		user.warning = false
		user.access = 30



