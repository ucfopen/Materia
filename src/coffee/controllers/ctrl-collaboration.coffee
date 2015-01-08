# The collaboration modal on the My Widgets page
app = angular.module 'materia'
app.controller 'CollaborationController', ($scope, selectedWidgetSrv, widgetSrv) ->
	lastSearch = ''
	$scope.inputs =
		userSearchInput: ''
	$scope.searchResults =
		show: no
		matches: []

	$scope.$watch 'inputs.userSearchInput', (input) ->
		$scope.search(input)

	$scope.search = (nameOrFragment) ->
		return if nameOrFragment == lastSearch

		$scope.searchResults.show = yes
		inputArray = nameOrFragment.split(',')
		nameOrFragment = inputArray[inputArray.length - 1]

		Materia.Coms.Json.send 'users_search', [nameOrFragment], (matches) ->

			if matches?.length < 1
				$scope.searchResults.matches = []
				return

			for user in matches
				user.gravatar = $scope.$parent.getGravatar(user.email)

			$scope.searchResults.matches = matches

	$scope.searchMatchClick = (user) ->
		$scope.inputs.userSearchInput = ''

		$scope.searchResults.show = no
		$scope.searchResults.matches = []

		# Do not add duplicates
		for existing_user in $scope.$parent.collaborators
			return if user.id == existing_user.id

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
		that          = this.$parent
		users         = that.collaborators
		remove_widget = no
		widget_id     = $scope.$parent.selectedWidget.id
		permObj       = []
		user_ids      = {}

		for user in users
			# Do not allow saving if a demotion dialog is on the screen
			return if user.warning

			remove_widget = (user.isCurrentUser and user.remove)

			access = {}
			access[user.access] = !user.remove

			user_ids[user.id] = [user.access, user.expires]
			permObj.push
				user_id: user.id
				expiration: user.expires
				perms: access

		$scope.$parent.perms.widget = user_ids
		Materia.Coms.Json.send 'permissions_set', [0,widget_id, permObj], (returnData) ->
			if returnData == true
				$scope.modals.showCollaboration = no
				widgetSrv.removeWidget(widget_id) if remove_widget
				$scope.$apply()
			else
				alert(if returnData?.msg? then returnData.msg else 'There was an unkown error saving your changes.')

	$scope.checkForWarning = (user) ->
		if user.isCurrentUser and user.access < 30
			user.warning = yes

	$scope.cancelDemote = (user) ->
		user.warning = no
		user.access = 30
