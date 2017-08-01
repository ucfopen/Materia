app = angular.module 'materia'
app.controller 'MyWidgetsController', ($scope, $q, $window, widgetSrv, userServ, selectedWidgetSrv, beardServ, Alert) ->
	$scope.alert = Alert
	$scope.baseUrl = BASE_URL
	$scope.widgets =
		widgetList: []
	$scope.selected =
		widget: null
		perms: {}
		scores: {}
		accessLevel: 0
		shareable: false
		editable: true
		hasScores: false
		preview: ""
		guestAccess: false
		embeddedOnly: false
	$scope.perms =
		collaborators: []
	$scope.show =
		collaborationModal: no
		availabilityModal: no
		copyModal: no
		olderScores: no
		exportModal: no
		deleteDialog: no
		embedToggle : no
		editPublishedWarning: no
	firstRun = true

	$scope.SCORE_VIEW_GRAPH = 0
	$scope.SCORE_VIEW_TABLE = 1
	$scope.SCORE_VIEW_DATA = 2
	$scope.selectedScoreView = [] # array of above (i.e. 0 = graph)

	$scope.$on 'selectedWidget.update', (evt) ->
		$scope.selected.widget = selectedWidgetSrv.get()
		sessionCheck = userServ.checkValidSession()
		sessionCheck.then (check) ->
			if check
				setSelectedWidget()
			else
				location.reload true

	$scope.$on 'widgetList.update', (evt) ->
		updateWidgets widgetSrv.getWidgets()

	$scope.$on 'widgetAvailability.update', (evt) ->
		$scope.selected.widget = selectedWidgetSrv.get()
		populateAvailability($scope.selected.widget.open_at, $scope.selected.widget.close_at)
		populateAttempts($scope.selected.widget.attempts)

	$scope.$on 'collaborators.update', ->
		countCollaborators()

	$scope.$on 'user.update', (evt) ->
		$scope.user = userServ.get()

	updateWidgets = (data) ->
		Materia.Set.Throbber.stopSpin '.courses'

		if !data
			$scope.widgets.widgetList = []
			$scope.$apply()
		else if data.then?
			data.then updateWidgets
		else
			angular.forEach data, (widget, key) ->
				widget.icon = Materia.Image.iconUrl(widget.widget.dir, 60)
				widget.beard = beardServ.getRandomBeard()

			$scope.$apply ->
				$scope.widgets.widgetList = data.sort (a,b) -> return b.created_at - a.created_at
		if firstRun
			widgetSrv.selectWidgetFromHashUrl()
			firstRun = false

	# Populate the widget list
	# This was originally part of prepare(), but is prepare really necessary now?
	deferredWidgets = widgetSrv.getWidgets()
	deferredWidgets.then updateWidgets

	# This doesn't actually "set" the widget
	# It ensures required scope objects have been acquired before kicking off the display
	setSelectedWidget = ->
		$scope.perms.stale = true

		populateDisplay()

		currentId = $scope.selected.widget.id

		$q.all([
			userServ.get(),
			selectedWidgetSrv.getUserPermissions(),
			selectedWidgetSrv.getScoreSummaries(),
			selectedWidgetSrv.getDateRanges()
		])
		.then (data) ->
			# don't render an old display if they user has clicked another widget
			if $scope.selected.widget.id != currentId
				return

			$scope.user = data[0]
			$scope.perms = data[1]
			$scope.selected.scores = data[2]

			Materia.MyWidgets.Statistics.clearGraphs()

			populateAccess()

	populateAttempts = (attemptsAllowed) ->
		attemptsAllowed = parseInt attemptsAllowed, 10
		$scope.attemptText = if attemptsAllowed > 0 then attemptsAllowed else 'Unlimited'

	populateAvailability = (startDateInt, endDateInt) ->
		$scope.availability = widgetSrv.convertAvailibilityDates(startDateInt, endDateInt)
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
		$scope.show.availabilityModal = false
		$scope.show.collaborationModal = false
		$scope.show.copyModal = false
		$scope.show.deleteDialog = false
		$scope.show.editPublishedWarning = false
		$scope.show.embedToggle = false
		$scope.show.exportModal = false
		$scope.show.olderScores = false

		$scope.selected.accessLevel = 0
		$scope.selected.editable = true
		$scope.selected.shareable = false
		$scope.selected.hasScores = false
		$scope.perms.collaborators = []

		# TODO
		$scope.perms.error = false

		$scope.selected.preview = "preview/#{$scope.selected.widget.id}/#{$scope.selected.widget.clean_name}"
		$scope.selected.copy_title =  "#{$scope.selected.widget.name} copy"
		$scope.selected.widget.iconbig = Materia.Image.iconUrl $scope.selected.widget.widget.dir, 275

	# Second half of populateDisplay
	# This allows us to update the display before the callback of scores finishes, which speeds up UI
	populateAccess = ->
		# accessLevel == 0 is effectively read-only
		if $scope.perms.user[$scope.user.id]?[0]?
			$scope.selected.accessLevel = Number $scope.perms.user[$scope.user.id][0]

		$scope.selected.editable = ($scope.selected.accessLevel > 0 and parseInt($scope.selected.widget.widget.is_editable) is 1)

		if $scope.selected.editable
			$scope.selected.edit = "/widgets/#{$scope.selected.widget.widget.dir}create\##{$scope.selected.widget.id}"
		else
			$scope.selected.edit = "#"

		countCollaborators()

		$scope.selected.shareable = $scope.selected.accessLevel != 0

		populateAvailability($scope.selected.widget.open_at, $scope.selected.widget.close_at)
		populateAttempts($scope.selected.widget.attempts)

		if !$scope.selected.widget.widget.is_draft
			if $scope.selected.scores.list.length > 0
				# TODO determine if populateScoreWrapper functionality can be implemented differently
				angular.forEach $scope.selected.scores.list, (semester, index) ->
					populateScoreWrapper(semester, index)

				for d in $scope.selected.scores.list # is this check necessary? Is there ever a use case where a list object won't have a distro array?
					if d.distribution?
						$scope.selected.hasScores = true
						break

	# count up the number of other users collaborating
	countCollaborators = ->
		count = 0
		for id of $scope.perms.widget
			if id != $scope.user.id then count++
		$scope.collaborateCount = if count > 0 then  " (#{count})"  else ""

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
