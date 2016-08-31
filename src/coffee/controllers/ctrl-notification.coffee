app = angular.module 'materia'
app.controller 'notificationCtrl', ($scope, $sce, notificationServ) ->
	$scope.values = {notifications: []}
	$scope.clicked = false

	onNotificationChange = (notifications) ->
		$scope.values.notifications = notificationServ.getNotifications()
		$scope.$apply()
		# @TODO: replace with css animations?
		$(document).on 'click', '.notice .close', (event) ->
			event.preventDefault()
			$('.notice').slideToggle(150)

		return null

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
		Materia.Coms.Json.send 'notification_delete', [$scope.values.notifications[index].id]
		$scope.values.notifications.splice(index, 1)

	notificationServ.subscribe($scope, onNotificationChange)
	notificationServ.updateNotifcationsEvery(30, true)

	return null
