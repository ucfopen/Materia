app = angular.module 'materia'
app.controller 'adminUserController', ($scope, adminSrv, userServ) ->

	lastSearch = ''
	$scope.inputs =
		userSearchInput: ''
	$scope.searchResults =
		show: no
		searching: no
		matches: []

	$scope.$watch 'inputs.userSearchInput', (input) ->
		$scope.search(input)

	$scope.selectedUser = null
	$scope.additionalData = null
	$scope.error_message = []

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

		adminSrv.searchUsers nameOrFragment, (matches) ->
			if matches?.halt
				alert(matches.msg)
				location.reload true
				return

			$scope.searchResults.searching = no

			if not matches or matches?.length < 1
				matches = []

			$scope.searchResults.none = matches.length < 1

			for user in matches
				user.gravatar = userServ.getAvatar user, 50

			matches = matches.sort(_sortNames);

			$scope.selectedMatch = matches[0]
			$scope.selectedIndex = 0
			$scope.searchResults.matches = matches
			$scope.$apply()

	_sortNames = (userA, userB) ->
		nameA = userA.first + " " + userA.last
		nameB = userB.first + " " + userB.last
		return nameA.localeCompare(nameB)

	$scope.searchMatchClick = (user) ->
		adminSrv.lookupUser user.id, (data) ->
			$scope.inputs.userSearchInput = ''
			$scope.selectedUser = user
			$scope.additionalData = data

			_processPlayed()

			console.log $scope.additionalData.instances_played

			$scope.$apply()

	_processPlayed = ->
		_pre = []

		for play in $scope.additionalData.instances_played
			unless _pre[play.id]
				_pre[play.id] =
					id: play.id
					name: play.name
					plays: []
			_pre[play.id].plays.push play

		$scope.additionalData.instances_played = []
		for id, item of _pre
			$scope.additionalData.instances_played.push item

	$scope.save = ->
		update =
			id: $scope.selectedUser.id
			email: $scope.selectedUser.email
			is_student: $scope.selectedUser.is_student
			notify: $scope.selectedUser.profile_fields.notify
			useGravatar: $scope.selectedUser.profile_fields.useGravatar
		adminSrv.saveUser update, (response) ->
			$scope.error_message = []
			for prop, stat of response
				$scope.error_message.push stat unless stat == true
			delete $scope.error_message if $scope.error_message.len is 0
			$scope.$apply()

	$scope.deselectUser = ->
		$scope.error_message = []
		$scope.selectedUser = null
		$scope.additionalData = null
