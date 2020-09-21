const app = angular.module('materia')
app.controller('UserSettingsController', function (
	$scope,
	Please,
	UserServ,
	APIServ,
	$log,
	$window
) {
	const _saveSettings = () => {
		Materia.Set.Throbber.startSpin('.page')

		const newSettings = {
			notify: $scope.user.notify,
			useGravatar: $scope.useGravatar,
		}

		Materia.Coms.Json.post('/api/user/settings', newSettings)
			.then((result) => {
				APIServ.filterError(result)
				Materia.Set.Throbber.stopSpin('.page')
				$scope.settingsForm.$setPristine()
				if (result.success) {
					// update my scope object
					for (let k in result.meta) {
						UserServ.updateSettings(k, result.meta[k])
					}

					// update the user avatar
					if ((result.avatar != null ? result.avatar.length : undefined) > 0) {
						UserServ.updateSettings('avatar', result.avatar)
						$scope.avatar = UserServ.getCurrentUserAvatar(100)
					}
				}

				Please.$apply()
			})
			.catch(() => {
				$log.error('error updating settings')
				Materia.Set.Throbber.stopSpin('.page')
				Please.$apply()
			})
	}

	$scope.user = UserServ.getCurrentUser()
	$scope.avatar = UserServ.getCurrentUserAvatar(100)
	$scope.useGravatar = $scope.user.avatar.indexOf('gravatar') > -1
	$scope.saveSettings = _saveSettings

	if (($scope.beardMode = $window.localStorage.beardMode)) {
		$scope.disableBeardMode = () => {
			$scope.beardMode = $window.localStorage.beardMode = false
		}
	}
})
