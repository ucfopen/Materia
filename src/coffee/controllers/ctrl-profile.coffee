app = angular.module 'materia'
app.controller 'profileCtrl', ['$scope', ($scope) ->
	$scope.more = false
	$scope.loading = false
	_offset = 0
	_user_id = null

	init = (gateway) ->

	# Executes the API function and an optional callback function
	# @param   callback	optional callback
	$scope.getLogs = (callback) ->
		$scope.loading = true

		#Gets current user
		Materia.Coms.Json.send 'user_get', null, (user) ->
			_user_id = user.id if _user_id?
			Materia.Coms.Json.send 'play_activity_get', [_offset], (data) ->
				_showPlayActivity data
				callback() if callback?

	# Shows selected game information on the mainscreen.
	# @param   data   Score data sent back from the server
	_showPlayActivity = (data) ->
		if !$scope.activities
			$scope.activities = []
		$scope.activities.push.apply($scope.activities, data.activity)
		$scope.more = data.more
		_offset = $scope.activities.length
		$scope.loading = false
		$scope.$apply()

	$scope.getLink = (activity) ->
		if activity.is_complete == '1'
			return '/scores/' + activity.inst_id + '#play-' + activity.play_id
		return ''

	$scope.getScore = (activity) ->
		if activity.is_complete == '1'
			return Math.round(parseFloat(activity.percent))
		return '--'

	$scope.getStatus = (activity) ->
		if activity.is_complete == '1'
			return ''
		return 'No Score Recorded'

	$scope.getDate = (activity) ->
		Materia.Set.DateTime.parseObjectToDateString(activity.created_at) +
		' at ' +
		Materia.Set.DateTime.fixTime(parseInt(activity.created_at, 10)*1000, DATE)

	Namespace('Materia.Profile.Activity').Load =
		init: init
		getLogs: $scope.getLogs
]

