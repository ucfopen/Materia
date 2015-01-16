# Handles the widget currently selected (on the big screeny thing)
app = angular.module 'materia'
app.controller 'SelectedWidgetController', ($scope, $q, widgetSrv,selectedWidgetSrv, userServ, $anchorScroll) ->
	# old stuff
	$scope.STORAGE_TABLE_MAX_ROWS_SHOWN = 100
	$scope.selectedWidgetInstId = 0
	$scope.scoreSummaries = {}
	$scope.semesterPlayLogs = {}
	$scope.storageData = {}
	$scope.selectedData = null
	$scope.dateRanges = null

	# refactoring scope variables
	$scope.perms = {}
	$scope.scores = null
	$scope.storage = null
	$scope.showCollaborationModal = false
	$scope.showCopyModal = false

	# Displays a no-access message when attempting to access a widget without sharing permissions.
	$scope.$on 'selectedWidget.notifyAccessDenied', ->
		$scope.error = true
		$scope.$apply()

	# Flags to help condense conditional statement checks
	$scope.accessLevel = 0
	$scope.selected.editable = true
	$scope.shareable = false
	$scope.hasScores = false

	$scope.collaborators = []
	$scope.selected.showOlderScores = false

	$scope.baseUrl = BASE_URL

	$scope.popup = () ->
		if $scope.selected.editable and $scope.selected.shareable
			$scope.showAvailabilityModal = true
			Materia.MyWidgets.Availability.popup()

	$scope.hideModal = -> this.$parent.hideModal()

	$scope.preview = ""

	getCurrentSemester = ->
		return $scope.selectedData.year+' '+$scope.selectedData.term

	$scope.exportPopup =  ->
		$scope.showExportModal = true
		Materia.MyWidgets.Csv.buildPopup()

	$scope.copyWidget = () ->
		Materia.MyWidgets.Tasks.copyWidget $scope.selected.widget.id, $scope.copy_title, (inst_id) ->
			$scope.showCopyModal = false
			widgetSrv.addWidget(inst_id)
			$scope.$apply()

	$scope.deleteWidget = ->
		Materia.MyWidgets.Tasks.deleteWidget $scope.selected.widget.id, (results) ->
			if results
				$scope.showDeleteDialog = false
				widgetSrv.removeWidget($scope.selected.widget.id)
				$scope.$apply()

	$scope.editWidget = ->
		if $scope.selected.editable
			Materia.Coms.Json.send 'widget_instance_lock',[$scope.selectedWidgetInstId], (success) ->
				if success
					if $scope.selected.shareable
						$scope.showEditPublishedWarning = true
					else
						window.location = $scope.selected.edit
				else
					alert('This widget is currently locked you will be able to edit this widget when it is no longer being edited by somebody else.')
				$scope.$apply()

		return false

	$scope.getEmbedLink = ->
		if $scope.selected.widget is null then return ""

		width = if String($scope.selected.widget.widget.width) != '0' then  $scope.selected.widget.widget.width else 800
		height = if String($scope.selected.widget.widget.height) != '0' then $scope.selected.widget.widget.height else 600
		draft = if $scope.selected.widget.is_draft then "#{$scope.selected.widget.widget.name} Widget" else $scope.selected.widget.name

		"<iframe src='#{BASE_URL}embed/#{$scope.selected.widget.id}/#{$scope.selected.widget.clean_name}' width='#{width}' height='#{height}' style='margin:0;padding:0;border:0;'><a href='#{BASE_URL}play/#{$scope.selected.widget.id}/#{$scope.selected.widget.clean_name}'>#{draft}</a></iframe>"

	toggleShareWidgetContainer = (state) ->
		$shareWidgetContainer = $('.share-widget-container')

		unless state?
			state = $shareWidgetContainer.hasClass('closed') ? 'open' : 'close'

		if state == 'open'
			$shareWidgetContainer.switchClass('closed', '', 200)
		else if state == 'close'
			$shareWidgetContainer.switchClass('', 'closed', 200)

	$scope.enableOlderScores = ->
		$scope.selected.showOlderScores = true

	getSemesterFromTimestamp = (timestamp) ->
		for range in $scope.dateRanges
			return range if timestamp >= parseInt(range.start, 10) && timestamp <= parseInt(range.end, 10)
		return undefined

	createSemesterString = (o) ->
		return (o.year + '_' + o.term).toLowerCase()

	getDateForBeginningOfTomorrow = ->
		d = new Date()
		d.setDate(d.getDate() + 1)
		new Date(d.getFullYear(), d.getMonth(), d.getDate())

	$scope.showCopyDialog = ->
		$scope.showCopyModal = true if $scope.selected.accessLevel != 0

	$scope.showDelete = ->
		$scope.showDeleteDialog = !$scope.showDeleteDialog if $scope.selected.accessLevel != 0

	$scope.showCollaboration = ->
		user_ids = []
		for user of $scope.perms.widget
			user_ids.push user
		$scope.collaborators = []

		Materia.Coms.Json.send 'user_get', [user_ids], (users) ->
			users.sort (a,b) ->
				if(a.first < b.first || (a.first == b.first && a.last < b.last) || (a.last == b.last && a.middle < b.middle))
					return -1
				return 1

			for user in users
				user.access = $scope.perms.widget[user.id][0]
				timestamp = parseInt($scope.perms.widget[user.id][1], 10)
				user.expires = timestamp
				user.expiresText = getExpiresText(timestamp)
				user.gravatar = getGravatar(user.email)

			$scope.collaborators = users
			$scope.$apply()

			$scope.setupPickers()

		$scope.showCollaborationModal = true

	$scope.setupPickers = ->
		# fill in the expiration link text & setup click event
		for user in $scope.collaborators
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

	getExpiresText = (timestamp) ->
		timestamp = parseInt(timestamp, 10)
		if isNaN(timestamp) or timestamp == 0 then 'Never' else $.datepicker.formatDate('mm/dd/yy', new Date(timestamp * 1000))

	$scope.getGravatar = getGravatar = (email) ->
		'https://secure.gravatar.com/avatar/'+hex_md5(email)+'?d=' + BASE_URL + 'assets/img/default-avatar.jpg'

