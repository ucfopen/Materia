app.controller 'notificationCtrl', ['$scope', '$sce', ($scope, $sce) ->
	$scope.notifications = []
	$scope.clicked = false

	$scope.init = (gateway) ->

	$scope.getNotifications = ->
		Materia.Coms.Json.send 'notifications_get', null, (notifications) ->
			$scope.notifications = notifications
			console.log($scope.notifications)
			$scope.$apply()
			return false
		,
		true

	$scope.trust = (notification) ->
		$sce.trustAsHtml(notification)

	$scope.clickNotification = ->
		if $scope.clicked
			$('#notices').slideUp ->
				$('#notifications_link').removeClass 'selected'
				if ie8Browser?
					$('#swfplaceholder').hide()
					$('object').css 'visibility', 'visible'
		else
			$object = $('object')
			if ie8Browser?
				$('#swfplaceholder').show() if $('#swfplaceholder').length > 0
				$object.css 'visibility', 'hidden'
			$('#notifications_link').addClass 'selected'
			$('#notifications_link').show()
			$('#notices').children().fadeIn()
			$('#notices').slideDown ->
		$scope.clicked = !$scope.clicked

	$scope.removeNotification = (index) ->
		Materia.Coms.Json.send 'notification_delete', [$scope.notifications[index].id]
		$scope.notifications.splice(index, 1)
]

