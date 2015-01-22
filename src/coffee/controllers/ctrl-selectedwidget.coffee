# Handles the widget currently selected (on the big screeny thing)
app = angular.module 'materia'
app.controller 'SelectedWidgetController', ($scope, $q, widgetSrv,selectedWidgetSrv, userServ, $anchorScroll) ->
	# old stuff
	$scope.baseUrl = BASE_URL
	$scope.STORAGE_TABLE_MAX_ROWS_SHOWN = 100
	$scope.selectedWidgetInstId = 0
	$scope.scoreSummaries = {}
	$scope.semesterPlayLogs = {}
	$scope.storageData = {}
	$scope.selectedData = null
	$scope.dateRanges = null

	# refactoring scope variables
	$scope.perms =
		collaborators: []
	$scope.scores = null
	$scope.storage = null

	$scope.show =
		collaborationModal: no
		availabilityModal: no
		copyModal: no
		olderScores: no
		exportModal: no
		deleteDialog: no
		editPublishedWarning: no

	$scope.selectedWidget = null # updated automagically with selectedWidgetSrv service
	$scope.$on 'selectedWidget.update', (evt) -> # hook to update selected widget when service updates
		$scope.selectedWidget = selectedWidgetSrv.get()

		# this check was originally in populateDisplay, we're moving it here so it's called before widget data is fetched
		sessionCheck = userServ.checkValidSession()
		sessionCheck.then (check) ->

			if check? then setSelectedWidget()

	# Displays a no-access message when attempting to access a widget without sharing permissions.
	$scope.$on 'selectedWidget.notifyAccessDenied', ->
		$scope.error = true
		$scope.$apply()

	$scope.noWidgetState = false
	$scope.$on 'selectedWidget.hasNoWidgets', (evt) ->
		$scope.noWidgetState = true
		$scope.$apply()

	$scope.user = {} # grab current user, link it to service
	$scope.$on 'user.update', (evt) ->
		$scope.user = userServ.get()
		# $scope.$apply() # required?

	# Flags to help condense conditional statement checks
	$scope.accessLevel = 0
	$scope.editable = true
	$scope.shareable = false
	$scope.hasScores = false

	$scope.SCORE_VIEW_GRAPH = 0
	$scope.SCORE_VIEW_TABLE = 1
	$scope.SCORE_VIEW_DATA = 2
	$scope.selectedScoreView = [] # array of above (i.e. 0 = graph)

	$scope.popup = ->
		if $scope.editable and $scope.shareable
			$scope.show.availabilityModal = yes
			Materia.MyWidgets.Availability.popup()

	$scope.hideModal = -> this.$parent.hideModal()

	# This doesn't actually "set" the widget
	# It ensures required scope objects have been acquired before kicking off the display
	setSelectedWidget = ->
		populateDisplay()

		currentId = $scope.selectedWidget.id

		$q.all([
			userServ.get(),
			selectedWidgetSrv.getUserPermissions(),
			selectedWidgetSrv.getScoreSummaries(),
			selectedWidgetSrv.getDateRanges()
		])
		.then (data) ->
			# don't render an old display if they user has clicked another widget
			if $scope.selectedWidget.id != currentId
				return

			$scope.user = data[0]
			$scope.perms = data[1]
			$scope.scores = data[2]

			Materia.MyWidgets.Statistics.clearGraphs()

			populateAccess()

	$scope.preview = ""
	$scope.edit = ""

	getCurrentSemester = ->
		return $scope.selectedData.year+' '+$scope.selectedData.term

	populateAttempts = (attemptsAllowed) ->
		attemptsAllowed = parseInt attemptsAllowed, 10
		$scope.attemptText = if attemptsAllowed > 0 then attemptsAllowed else 'Unlimited'

	populateAvailability = (startDateInt, endDateInt) ->
		$scope.availability = Materia.Set.Availability.get(startDateInt, endDateInt)
		$scope.availabilityStart = startDateInt
		$scope.availabilityEnd = endDateInt

		if endDateInt < 0 && startDateInt < 0
			$scope.availabilityMode = "anytime"
		else if startDateInt < 0 && endDateInt > 0
			$scope.availabilityMode = "open until"
		else if startDateInt > 0 && endDateInt < 0
			$scope.availabilityMode = "anytime after"
		else
			$scope.availabilityMode = "from"

	# Shows selected game information on the mainscreen.
	populateDisplay = ->
		# reset scope variables to defaults
		count = null
		$scope.show.olderScores = false
		$scope.accessLevel = 0
		$scope.editable = true
		$scope.shareable = false
		$scope.hasScores = false
		$scope.perms.collaborators = []

		# TODO
		$scope.error = false

		$scope.beard = window.BEARDS[Math.floor(Math.random() * window.BEARDS.length)]

		$scope.preview = "preview/#{$scope.selectedWidget.id}/#{$scope.selectedWidget.clean_name}"
		$scope.copy_title =  "#{$scope.selectedWidget.name} copy"
		$scope.selectedWidget.iconbig = Materia.Image.iconUrl $scope.selectedWidget.widget.dir, 275

		# Tell Materia we are still logged in
		sendHeartbeat()

	# Second half of populateDisplay
	# This allows us to update the display before the callback of scores finishes, which speeds up UI
	populateAccess = ->
		# accessLevel == 0 is effectively read-only
		if $scope.perms.user[$scope.user.id]?[0]?
			$scope.accessLevel = Number $scope.perms.user[$scope.user.id][0]

		$scope.editable = ($scope.accessLevel > 0 and parseInt($scope.selectedWidget.widget.is_editable) is 1)

		if $scope.editable
			$scope.edit = "widgets/#{$scope.selectedWidget.widget.dir}create\##{$scope.selectedWidget.id}"
		else
			$scope.edit = "#"

		# count up the number of other users collaborating
		count = 0
		for id of $scope.perms.widget
			if id != $scope.user.id then count++
		$scope.collaborateCount = if count > 0 then  " (#{count})"  else ""

		# DeMorgan's, anyone?
		$scope.shareable = $scope.accessLevel != 0

		populateAvailability($scope.selectedWidget.open_at, $scope.selectedWidget.close_at)
		populateAttempts($scope.selectedWidget.attempts)

		if !$scope.selectedWidget.widget.is_draft
			if $scope.scores.list.length > 0
				# TODO determine if populateScoreWrapper functionality can be implemented differently
				angular.forEach $scope.scores.list, (semester, index) ->
					populateScoreWrapper(semester, index)

				for d in $scope.scores.list # is this check necessary? Is there ever a use case where a list object won't have a distro array?
					if d.distribution?
						$scope.hasScores = true
						break

	$scope.exportPopup =  ->
		# Do not show modal disabled
		return if $scope.scores.list.length == 0 || !$scope.hasScores
		$scope.show.exportModal = true
		Materia.MyWidgets.Csv.buildPopup()

	$scope.copyWidget = ->
		Materia.MyWidgets.Tasks.copyWidget $scope.selectedWidget.id, $scope.copy_title, (inst_id) ->
			$scope.show.copyModal = false
			widgetSrv.addWidget(inst_id)
			$scope.$apply()

	$scope.deleteWidget = ->
		Materia.MyWidgets.Tasks.deleteWidget $scope.selectedWidget.id, (results) ->
			if results
				$scope.show.deleteDialog = false
				widgetSrv.removeWidget($scope.selectedWidget.id)
				$scope.$apply()

	$scope.editWidget = ->
		if $scope.editable
			Materia.Coms.Json.send 'widget_instance_lock',[$scope.selectedWidgetInstId], (success) ->
				if success
					if $scope.shareable
						$scope.show.editPublishedWarning = true
					else
						window.location = $scope.edit
				else
					alert('This widget is currently locked you will be able to edit this widget when it is no longer being edited by somebody else.')
				$scope.$apply()

		return false

	$scope.getEmbedLink = ->
		if $scope.selectedWidget is null then return ""

		width = if String($scope.selectedWidget.widget.width) != '0' then  $scope.selectedWidget.widget.width else 800
		height = if String($scope.selectedWidget.widget.height) != '0' then $scope.selectedWidget.widget.height else 600
		draft = if $scope.selectedWidget.is_draft then "#{$scope.selectedWidget.widget.name} Widget" else $scope.selectedWidget.name

		"<iframe src='#{BASE_URL}embed/#{$scope.selectedWidget.id}/#{$scope.selectedWidget.clean_name}' width='#{width}' height='#{height}' style='margin:0;padding:0;border:0;'><a href='#{BASE_URL}play/#{$scope.selectedWidget.id}/#{$scope.selectedWidget.clean_name}'>#{draft}</a></iframe>"

	toggleShareWidgetContainer = (state) ->
		$shareWidgetContainer = $('.share-widget-container')

		unless state?
			state = $shareWidgetContainer.hasClass('closed') ? 'open' : 'close'

		if state == 'open'
			$shareWidgetContainer.switchClass('closed', '', 200)
		else if state == 'close'
			$shareWidgetContainer.switchClass('', 'closed', 200)

	populateScoreWrapper = (semester, index) ->

		#  no scores, but we do have storage data
		if !semester.distribution? and semester.storage?
			$scope.setScoreView(index, 2)

		else #  has scores, might have storage data
			# Get the score total by summing up the distribution array
			semester.totalScores = semester.distribution.reduce (prev, cur) -> prev + cur

			$scope.setScoreView(index, 0)

	$scope.setScoreView = (index, view) ->
		$scope.selectedScoreView[index] = view

	$scope.enableOlderScores = ->
		$scope.show.olderScores = true

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
		$scope.show.copyModal = true if $scope.accessLevel != 0

	$scope.showDelete = ->
		$scope.show.deleteDialog = !$scope.show.deleteDialog if $scope.accessLevel != 0

	$scope.showCollaboration = ->
		user_ids = []
		user_ids.push(user) for user of $scope.perms.widget

		$scope.perms.collaborators = []

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
				user.gravatar = userServ.getAvatar user

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

	getExpiresText = (timestamp) ->
		timestamp = parseInt(timestamp, 10)
		if isNaN(timestamp) or timestamp == 0 then 'Never' else $.datepicker.formatDate('mm/dd/yy', new Date(timestamp * 1000))

	sendHeartbeat = ->
		Materia.Coms.Json.send 'session_valid', [null, false], (data) ->
			true

	Namespace('Materia.MyWidgets').SelectedWidget =
		populateAvailability		: populateAvailability,
		populateAttempts			: populateAttempts
