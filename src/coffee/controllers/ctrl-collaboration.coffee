# The collaboration modal on the My Widgets page
app = angular.module 'materia'
app.controller 'CollaborationController', ($scope, selectedWidgetSrv, widgetSrv, userServ) ->
	LEFT = 37
	UP = 38
	RIGHT = 39
	DOWN = 40
	ESC = 27

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

		if nameOrFragment == ""
			$scope.searchResults.show = no
			return

		lastSearch = nameOrFragment

		$scope.searchResults.show = yes
		inputArray = nameOrFragment.split(',')
		nameOrFragment = inputArray[inputArray.length - 1]

		Materia.Coms.Json.send 'users_search', [nameOrFragment], (matches) ->
			if not matches or matches?.length < 1
				matches = []

			$scope.searchResults.none = matches.length < 1

			for user in matches
				user.gravatar = userServ.getAvatar user

			$scope.selectedMatch = matches[0]
			$scope.selectedIndex = 0
			$scope.searchResults.matches = matches
			$scope.$apply()

	$scope.searchKeyDown = (event) ->
		switch event.which
			when RIGHT
				$scope.selectedIndex++
			when LEFT
				$scope.selectedIndex--
			when DOWN
				$scope.selectedIndex += 2
			when UP
				$scope.selectedIndex -= 2
			when ESC
				$scope.searchResults.show = no
			else
				return

		$scope.selectedIndex = 0 if $scope.selectedIndex < 0
		$scope.selectedIndex = $scope.searchResults.matches.length - 1 if $scope.selectedIndex > $scope.searchResults.matches.length - 1

		$scope.selectedMatch = $scope.searchResults.matches[$scope.selectedIndex]

	$scope.searchMatchClick = (user) ->
		return if not user
		$scope.inputs.userSearchInput = ''

		$scope.searchResults.show = no
		$scope.searchResults.matches = []

		# Do not add duplicates
		$scope.perms.collaborators = [] if not $scope.perms.collaborators
		for existing_user in $scope.perms.collaborators
			return if user.id == existing_user.id

		$scope.perms.collaborators.push
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
		user.warning = true

	$scope.updatePermissions = ->
		remove_widget = no
		widget_id     = $scope.selected.widget.id
		permObj       = []
		user_ids      = {}

		for user in $scope.perms.collaborators
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

		$scope.perms.widget = user_ids
		Materia.Coms.Json.send 'permissions_set', [0,widget_id, permObj], (returnData) ->
			if returnData == true
				$scope.$emit 'collaborators.update', ''
				$scope.show.collaborationModal = no
				widgetSrv.removeWidget(widget_id) if remove_widget
				$scope.$apply()
			else
				alert(if returnData?.msg? then returnData.msg else 'There was an unkown error saving your changes.')

	$scope.checkForWarning = (user) ->
		if user.isCurrentUser and user.access < 30
			user.warning = yes

	$scope.cancelDemote = (user) ->
		user.warning = no
		user.remove = no
		user.access = 30
