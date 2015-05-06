'use strict'

app = angular.module 'materia'
app.directive 'scoreTable', (selectedWidgetSrv, $window) ->
	restrict: 'A',
	link: ($scope, $element, $attrs) ->

		widgetId = selectedWidgetSrv.getSelectedId()
		tableSort = 'desc'
		$scope.users = {}
		userCount = []
		users = {}
		masterUserList = {}
		$scope.selectedUser = null

		term = $attrs.term
		year = $attrs.year

		logs = selectedWidgetSrv.getPlayLogsForSemester term, year
		logs.then (data) ->

			# process play logs into records for each user
			angular.forEach data, (log, index) ->

				uid = log.user_id
				name = if log.last then "#{log.last}, #{log.first}" else "Guests"

				unless users[uid]?
					users[uid] =
						uid : uid
						name: name
						scores : {}

				# make the score percentage readable
				percent = 0
				if log.done == "1"
					percent = parseFloat(log.perc).toFixed(2).replace('.00', '')

				# make the play duration readable
				duration = 0
				mins = (log.elapsed - log.elapsed % 60) / 60
				secs = log.elapsed % 60

				if mins != 0 then duration =  "#{mins}m #{secs}s"
				else duration = "#{secs}s"

				users[uid].scores[log.time.toString()] =
					date : new Date(log.time*1000).toDateString()
					percent : percent
					elapsed : duration
					complete : log.done
					id: log.id

			$scope.users = users
			masterUserList = users

		$scope.setSelectedUser = (id) ->
			$scope.selectedUser = $scope.users[id]

		$scope.showScorePage = (scoreId) ->
			$window.open  "scores/#{widgetId}/#single-#{scoreId}"
			return true

		$scope.searchStudentActivity = (query) ->

			if query == "" then return $scope.users = masterUserList
			$scope.selectedUser = null

			sanitized = query.toLowerCase().replace(/,/g, ' ')
			hits = {}
			misses = {}
			terms = sanitized.split ' '

			angular.forEach masterUserList, (user, index) ->
				match = false

				for term in terms
					if user.name.toLowerCase().indexOf(term) > -1
						match = true
					else
						match = false
						break

					if match
						hits[user.uid] = user
					else
						misses[user.uid] = user

			$scope.users = hits

