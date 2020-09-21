const app = angular.module('materia')
app.controller('UserNotificationCtrl', function (Please, $scope, $sce) {
	let $notices = document.querySelector('#notices')
	const _toggleOpen = () => {
		$scope.isOpen = !$scope.isOpen
	}

	const _removeNotification = (index, id) => {
		let note = $scope.notifications[index]
		note.deleted = true
		Please.$apply()
		Materia.Coms.Json.send('notification_delete', [id]).then((success) => {
			if (success) {
				$scope.notifications.splice(index, 1)
			} else {
				note.deleted = false
			}
			Please.$apply()
		})
	}

	$scope.notifications = []
	$scope.isOpen = false
	$scope.removeNotification = _removeNotification
	$scope.trust = (notification) => $sce.trustAsHtml(notification)
	$scope.toggleOpen = _toggleOpen

	Materia.Coms.Json.send('notifications_get').then((notifications) => {
		$scope.notifications = notifications
		Please.$apply()
	})
})
