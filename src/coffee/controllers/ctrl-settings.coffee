app = angular.module 'materia'
app.controller 'settingsController', ($scope, $http, userServ) ->
	# SAVED_MESSAGE_DISPLAY_DELAY = 1000

	$scope.user = userServ.getCurrentUser()
	$scope.avatar = userServ.getCurrentUserAvatar(100)
	$scope.useGravatar = $scope.user.avatar.indexOf('gravatar') > -1
	$scope.showBeardMode = $scope.user.beardMode == true

	$scope.saveSettings = ->
		Materia.Set.Throbber.startSpin '.page'

		newSettings =
			notify: $scope.user.notify
			beardMode: $scope.user.beardMode == true
			useGravatar: $scope.useGravatar

		$http.post(window.location, newSettings)
			.success (data, status, headers, config) ->
				Materia.Set.Throbber.stopSpin('.page')
				$scope.settingsForm.$setPristine()
				if data.success

					# update my scope object
					for k, v of data.meta
						userServ.updateSettings k, v

					console.log userServ.getCurrentUser()

					# update the user avatar
					if data.avatar?.length > 0
						console.log 'update data'
						userServ.updateSettings 'avatar', data.avatar
						$scope.avatar = userServ.getCurrentUserAvatar(100)

			.error (data, status, headers, config) ->
				console.log 'error', data
				Materia.Set.Throbber.stopSpin('.page')
