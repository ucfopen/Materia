app = angular.module 'materia'
app.service 'notificationServ', ($rootScope) ->

	notifications = []
	ids = ''
	interval = null


	getNotifications = ->
		return notifications


	updateNotifcations = ->
		Materia.Coms.Json.send 'notifications_get', null, (result_notifications) ->
			resultIds = ''
			if result_notifications
				resultIds = (n.id for n in result_notifications)
				resultIds.join(',')

			# only emit if they changed
			if resultIds != ids
				ids = resultIds
				notifications = result_notifications
				$rootScope.$emit('notification-update');

	updateNotifcationsEvery = (seconds, startNow = false) ->
		clearInterval(interval)
		interval = setInterval ->
			updateNotifcations()
		, 1000 * seconds
		updateNotifcations() if startNow


	subscribe = (scope, callback) ->
		handler = $rootScope.$on('notification-update', callback);
		scope.$on('$destroy', handler);

	updateNotifcations:updateNotifcations
	getNotifications:getNotifications
	updateNotifcationsEvery:updateNotifcationsEvery
	subscribe:subscribe
