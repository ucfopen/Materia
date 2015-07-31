app = angular.module 'materia'
app.controller 'ltiCtrl', ($scope, $sce, widgetSrv) ->
	REFRESH_FAKE_DELAY_MS = 500
	CHANGE_SECTION_FADE_DELAY_MS = 250

	selectedWidget = null
	widgetsLoaded = false

	$scope.strHeader = 'Select a Widget:'
	$scope.query = {}

	if system? and system != ''
		$scope.strHeader = 'Select a Widget for use in ' + system + ':'

	$scope.calloutRefreshLink = ->
		$scope.showRefreshArrow = true

	loadWidgets = (fakeDelay) ->
		if not fakeDelay?
			fakeDelay = 1

		setTimeout ->
			widgetSrv.getWidgets().then (widgets) ->
				if widgets?.halt
					return
				if !widgets
					widgets = []

				widgetsLoaded = true

				len = widgets.length
				curWidget = null

				for widget in widgets
					widget.img = Materia.Image.iconUrl(widget.widget.dir, 60)
					widget.preview_url = BASE_URL + 'preview/' + widget.id
					widget.edit_url = BASE_URL + 'my-widgets/#' + widget.id

				$scope.widgets = widgets
				$scope.$apply()
		, fakeDelay

	$scope.highlight = (widget) ->
		for w in $scope.widgets
			w.selected = false
		widget.selected = true

	$scope.embedWidget = (widget) ->
		selectWidget(widget)

	selectWidget = (widget) ->
		if selectedWidget?.state?.state == 'pending'
			return

		selectedWidget = widget
		selectedWidget.state = 'pending'

		widget.img = Materia.Image.iconUrl widget.widget.dir, 60
		$scope.selectedWidget = widget

		setDisplayState('progress')

	finishProgressBarAndSetLocation = ->
		$('.progress-container').addClass('success')
		$('.progress-container').find('span').html('Success!')
		$('.progressbar').progressbar('value', 100)
		setTimeout ->
			announceChoice()

			if RETURN_URL?
				window.location = RETURN_URL + '?embed_type=basic_lti&url=' + encodeURI(selectedWidget.embed_url)
		, 1000

	setDisplayState = (newSection) ->
		$scope.section = newSection
		setTimeout ->
			$('body')
				.removeClass('selectWidget')
				.removeClass('widgetSelected')
				.removeClass('progress')
				.addClass(newSection)

			if newSection == 'selectWidget'
				if selectedWidget?
					$('.cancel-button').show()

				if !widgetsLoaded
					loadWidgets()

				$('#select-widget').fadeIn(CHANGE_SECTION_FADE_DELAY_MS)
			else if newSection == 'progress'
				$('.progressbar').progressbar()
				startProgressBar()
		, 0

	getRandInt = (min, max) -> Math.floor(Math.random() * (max - min + 1)) + min

	startProgressBar = ->
		# create a random number of progress bar stops
		availStops = [1,2,3,4,5,6,7,8,9]
		stops = tick: 0

		len = getRandInt(3, 5)
		for i in [0...len]
			stops[availStops.splice(getRandInt(0, availStops.length), 1)] = true

		intervalId = setInterval ->
			stops.tick++
			if stops[stops.tick]?
				$('.progressbar').progressbar('value', stops.tick * 10)

			if stops.tick >= 10
				clearInterval(intervalId)
				finishProgressBarAndSetLocation()
		, 200

		$(document).on 'keyup', (event) ->
			if event.keyCode == 16 # shift
				$scope.easterMode = true
				$scope.$apply()

	getAvailabilityStr = (startDate, endDate) ->
		availability = widgetSrv.convertAvailibilityDates(startDate, endDate)

		if endDate < 0 and startDate < 0
			return 'Anytime'
		else if startDate < 0 and endDate > 0
			return 'Open until ' + availability.end.date + ' at ' + availability.end.time
		else if startDate > 0 and endDate < 0
			return 'Anytime after ' + availability.start.date + ' at ' + availability.start.time
		else
			return 'From ' + availability.start.date + ' at ' + availability.start.time + ' until ' + availability.end.date + ' at  ' + availability.end.time

	announceChoice = ->
		widgetData = $scope.selectedWidget
		delete widgetData.element
		delete widgetData.searchCache

		# the host system can listen for this postMessage "message" event:
		if JSON.stringify
			if(parent.postMessage)
				parent.postMessage(JSON.stringify(widgetData), '*')

	$scope.refreshListing = ->
		$scope.showRefreshArrow = false
		loadWidgets(REFRESH_FAKE_DELAY_MS)

	setDisplayState 'selectWidget'

