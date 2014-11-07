app = angular.module 'materia'
app.controller 'notificationCtrl', ['$scope', '$sce', ($scope, $sce) ->
	$scope.notifications = []
	$scope.clicked = false

	Materia.Coms.Json.send 'notifications_get', null, (notifications) ->
		$scope.notifications = notifications
		console.log($scope.notifications)
		$scope.$apply()

		if $('header').hasClass('logged_in')
			Materia.Notification.getNotifications()

		Materia.Permissions.User.init(API_LINK)
		Materia.Permissions.Widget.init(API_LINK)

		$(document).on 'click', '.notice .close', (event) ->
			event.preventDefault()
			$('.notice').slideToggle(150)

		# when the transfer ownership button is pressed
		$(document).on 'click', '.owner a', (e) ->
			e.preventDefault()

			Materia.Permissions.Widget.transferView()
		return false

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

