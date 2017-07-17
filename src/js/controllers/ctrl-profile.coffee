app = angular.module 'materia'
app.controller 'profileCtrl', ($scope, userServ, $http, apiServ, dateTimeServ, $log) ->
	$scope.more    = no
	$scope.loading = no
	loaded_offset  = 0
	$scope.user    = {}
	$scope.avatar  = ''

	# Shows selected game information on the mainscreen.
	# @param   data   Score data sent back from the server
	showPlayActivity = (data) ->
		$scope.activities = [] if !$scope.activities

		$scope.activities.push.apply($scope.activities, data.activity)
		$scope.more    = data.more
		$scope.loading = no
		loaded_offset  = $scope.activities.length

	# Get my activity from the server
	$scope.getLogs = ->
		$scope.loading = yes

		$http.get('/api/user/activity', params: {start:loaded_offset, range:10})
			.success (result, status, headers, config) ->
				apiServ.filterError result
				showPlayActivity result
			.error (result, status, headers, config) ->
				$log.error result

	$scope.getLink = (activity) ->
		if activity.is_complete == '1'
			return "/scores/#{activity.inst_id}#play-#{activity.play_id}"
		return ''

	$scope.getScore = (activity) ->
		if activity.is_complete == '1'
			return Math.round(parseFloat(activity.percent))
		return '--'

	$scope.getStatus = (activity) ->
		return '' if activity.is_complete == '1'
		return 'No Score Recorded'

	$scope.getDate = (activity) ->
		dateTimeServ.parseObjectToDateString(activity.created_at) +
		' at ' +
		dateTimeServ.fixTime(parseInt(activity.created_at, 10)*1000, DATE)

	$scope.user    = userServ.getCurrentUser()
	$scope.avatar  = userServ.getCurrentUserAvatar(100)
	$scope.getLogs()
