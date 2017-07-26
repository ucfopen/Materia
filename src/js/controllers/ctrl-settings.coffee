app = angular.module 'materia'
app.controller 'settingsController', ($scope, $http, userServ, apiServ, $log) ->
	# SAVED_MESSAGE_DISPLAY_DELAY = 1000

	$scope.user = userServ.getCurrentUser()
	$scope.avatar = userServ.getCurrentUserAvatar(100)
	$scope.useGravatar = $scope.user.avatar.indexOf('gravatar') > -1

	$scope.saveSettings = ->
		Materia.Set.Throbber.startSpin '.page'

		newSettings =
			notify: $scope.user.notify
			useGravatar: $scope.useGravatar

		$http.post('/api/user/settings', newSettings)
			.success (result, status, headers, config) ->
				apiServ.filterError result
				Materia.Set.Throbber.stopSpin('.page')
				$scope.settingsForm.$setPristine()
				if result.success

					# update my scope object
					for k, v of result.meta
						userServ.updateSettings k, v

					# update the user avatar
					if result.avatar?.length > 0
						userServ.updateSettings 'avatar', result.avatar
						$scope.avatar = userServ.getCurrentUserAvatar(100)

			.error (result, status, headers, config) ->
				$log.error result
				Materia.Set.Throbber.stopSpin('.page')
