# Handles the widget currently selected (on the big screeny thing)
app = angular.module 'materia'
app.controller 'SelectedWidgetController', ($scope, $q, widgetSrv,selectedWidgetSrv, userServ, $anchorScroll, Alert) ->

	$scope.alert = Alert

	# Displays a no-access message when attempting to access a widget without sharing permissions.
	$scope.$on 'selectedWidget.notifyAccessDenied', ->
		$scope.perms.error = true
		$scope.$apply()

	$scope.popup = ->
		if $scope.selected.shareable and not $scope.selected.widget.is_draft
			$scope.show.availabilityModal = yes

	$scope.hideModal = -> this.$parent.hideModal()

	$scope.exportPopup =  ->
		# Do not show modal disabled
		$scope.show.exportModal = true
		Materia.MyWidgets.Csv.buildPopup()

	$scope.copyWidget = ->
		Materia.MyWidgets.Tasks.copyWidget $scope.selected.widget.id, $scope.selected.copy_title, (inst_id) ->
			$scope.show.copyModal = false
			widgetSrv.addWidget(inst_id)
			$scope.$apply()

	$scope.deleteWidget = ->
		Materia.MyWidgets.Tasks.deleteWidget $scope.selected.widget.id, (results) ->
			if results
				$scope.show.deleteDialog = false
				widgetSrv.removeWidget($scope.selected.widget.id)
				$scope.$apply()

	$scope.editWidget = ->
		if $scope.selected.editable
			Materia.Coms.Json.send 'widget_instance_lock',[$scope.selected.widget.id], (success) ->
				if success
					if $scope.selected.widget.is_draft
						window.location = $scope.selected.edit
					else
						$scope.show.editPublishedWarning = true
				else
					$scope.alert.msg = 'This widget is currently locked, you will be able to edit this widget when it is no longer being edited by somebody else.'
				$scope.$apply()

		return false

	$scope.getEmbedLink = ->
		if $scope.selected.widget is null then return ""

		width = if String($scope.selected.widget.widget.width) != '0' then  $scope.selected.widget.widget.width else 800
		height = if String($scope.selected.widget.widget.height) != '0' then $scope.selected.widget.widget.height else 600
		draft = if $scope.selected.widget.is_draft then "#{$scope.selected.widget.widget.name} Widget" else $scope.selected.widget.name

		"<iframe src='#{BASE_URL}embed/#{$scope.selected.widget.id}/#{$scope.selected.widget.clean_name}' width='#{width}' height='#{height}' style='margin:0;padding:0;border:0;'></iframe>"

	$scope.enableOlderScores = ->
		$scope.show.olderScores = true

	$scope.showCopyDialog = ->
		$scope.show.copyModal = true if $scope.selected.accessLevel != 0

	$scope.showDelete = ->
		$scope.show.deleteDialog = !$scope.show.deleteDialog if $scope.selected.accessLevel != 0

	$scope.showCollaboration = ->
		user_ids = []
		user_ids.push(user) for user of $scope.perms.widget

		return if user_ids.length < 1 or $scope.perms.stale

		$scope.perms.collaborators = []

		Materia.Coms.Json.send 'user_get', [user_ids], (users) ->
			users.sort (a,b) ->
				if(a.first < b.first || (a.first == b.first && a.last < b.last) || (a.last == b.last && a.middle < b.middle))
					return -1
				return 1

			$scope.studentAccessible = false

			for user in users
				if user.is_student then $scope.studentAccessible = true
				user.access = $scope.perms.widget[user.id][0]
				timestamp = parseInt($scope.perms.widget[user.id][1], 10)
				user.expires = timestamp
				user.expiresText = getExpiresText(timestamp)
				user.gravatar = userServ.getAvatar user, 50

			$scope.perms.collaborators = users
			$scope.$apply()

			$scope.setupPickers()

		$scope.show.collaborationModal = yes

	$scope.setupPickers = ->
		# fill in the expiration link text & setup click event
		for user in $scope.perms.collaborators
			do (user) ->
				$(".exp-date.user" + user.id).datepicker
					minDate: getDateForBeginningOfTomorrow()
					onSelect: (dateText, inst) ->
						timestamp = $(this).datepicker('getDate').getTime() / 1000
						user.expires = timestamp
						user.expiresText = getExpiresText(timestamp)
						$scope.$apply()

	$scope.removeExpires = (user) ->
		user.expires = null
		user.expiresText = getExpiresText(user.expires)

	getDateForBeginningOfTomorrow = ->
		d = new Date()
		d.setDate(d.getDate() + 1)
		new Date(d.getFullYear(), d.getMonth(), d.getDate())

	getExpiresText = (timestamp) ->
		timestamp = parseInt(timestamp, 10)
		if isNaN(timestamp) or timestamp == 0 then 'Never' else $.datepicker.formatDate('mm/dd/yy', new Date(timestamp * 1000))

