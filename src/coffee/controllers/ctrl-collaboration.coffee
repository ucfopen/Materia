# The collaboration modal on the My Widgets page
app = angular.module 'materia'
app.controller 'CollaborationController', ($scope, $timeout, selectedWidgetSrv, widgetSrv, userServ, Alert) ->

	$scope.alert = Alert

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
		searching: no
		matches: []

	$scope.$watch 'inputs.userSearchInput', (input) ->
		$scope.search(input)

	$scope.search = (nameOrFragment) ->

		return if nameOrFragment == lastSearch

		if nameOrFragment == ""
			$scope.searchResults.show = no
			$scope.searchResults.matches = []
			lastSearch = ""
			return

		lastSearch = nameOrFragment

		$scope.searchResults.show = yes
		$scope.searchResults.searching = yes

		inputArray = nameOrFragment.split(',')
		nameOrFragment = inputArray[inputArray.length - 1]

		Materia.Coms.Json.send 'users_search', [nameOrFragment], (matches) ->
			if matches?.halt
				$scope.alert.msg = matches.msg
				$scope.alert.fatal = true
				$scope.$apply()
				return

			$scope.searchResults.searching = no

			if not matches or matches?.length < 1
				matches = []

			$scope.searchResults.none = matches.length < 1

			for user in matches
				user.gravatar = userServ.getAvatar user, 50

			matches = matches.sort(sortNames);

			$scope.selectedMatch = matches[0]
			$scope.selectedIndex = 0
			$scope.searchResults.matches = matches
			$scope.$apply()

	sortNames = (userA, userB) ->
		nameA = userA.first + " " + userA.last
		nameB = userB.first + " " + userB.last
		return nameA.localeCompare(nameB)

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
				return
			else
				return

		$scope.selectedIndex = 0 if $scope.selectedIndex < 0
		$scope.selectedIndex = $scope.searchResults.matches.length - 1 if $scope.selectedIndex > $scope.searchResults.matches.length - 1

		$scope.selectedMatch = $scope.searchResults.matches[$scope.selectedIndex]

		# Scroll the search list so the selected match is always within view when navigating with arrow keys
		# Placed within a $timeout so logic is done only after the changes are made to the DOM
		$timeout ->
			selectedMatchHtml = document.getElementsByClassName("focused")[0]
			searchListHtml = document.getElementsByClassName("search_list")[0]

			if selectedMatchHtml.getBoundingClientRect().bottom > searchListHtml.getBoundingClientRect().bottom
				searchListHtml.scrollTop += selectedMatchHtml.offsetHeight + 5

			else if selectedMatchHtml.getBoundingClientRect().top < searchListHtml.getBoundingClientRect().top
				searchListHtml.scrollTop -= selectedMatchHtml.offsetHeight + 5

	$scope.searchMatchClick = (user) ->
		return if not user
		return if $scope.searchResults.matches.indexOf(user) is -1
		$scope.inputs.userSearchInput = ''

		if $scope.selected.widget.guest_access is false and user.is_student
			$scope.alert.msg = 'Students can not be given access to this widget unless Guest Mode is enabled!'
			$scope.alert.title = 'Unable to share with student'
			$scope.alert.fatal = false
			return

		$scope.searchResults.show = no
		$scope.searchResults.matches = []

		# Do not add duplicates
		$scope.perms.collaborators = [] if not $scope.perms.collaborators
		for existing_user in $scope.perms.collaborators
			if user.id == existing_user.id
				if existing_user.remove then existing_user.remove = false
				return

		$scope.perms.collaborators.push
			id: user.id
			is_student: user.is_student
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
		$scope.checkForWarning(user)

	$scope.updatePermissions = ->
		remove_widget = no
		widget_id     = $scope.selected.widget.id
		permObj       = []
		user_ids      = {}
		students  = []

		for user in $scope.perms.collaborators
			students.push user if user.is_student
			# Do not allow saving if a demotion dialog is on the screen
			return if user.warning

			# If we only have self-demotion access, don't send more info to server
			# or else we'll get a perm error
			continue if !$scope.selected.shareable and not user.isCurrentUser

			remove_widget = (user.isCurrentUser and user.remove) if not remove_widget

			access = {}
			access[user.access] = !user.remove

			if !user.remove
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
				if remove_widget then widgetSrv.removeWidget(widget_id)
				if students.length > 0 then $scope.selected.widget.student_access = true
			else
				$scope.alert.msg = (if returnData?.msg? then returnData.msg else 'There was an unknown error saving your changes.')
				if returnData?.halt? then $scope.alert.fatal = true

			$scope.$apply()

	$scope.checkForWarning = (user) ->
		if user.isCurrentUser and user.access <= 30
			user.warning = true

	$scope.cancelDemote = (user) ->
		user.warning = no
		user.remove = no
		user.access = 30
