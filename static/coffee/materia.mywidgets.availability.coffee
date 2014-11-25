# TODO: this class is very complex, refactor, maybe breakdown into more methods

MyWidgets = angular.module 'MyWidgets'
MyWidgets.controller 'WidgetSettingsController', ($scope, selectedWidgetSrv, widgetSrv) ->
	$scope.range = ''
	$scope.inst = []
	$scope.startDate = false
	$scope.endDate = false
	$scope.start =
		date: ''
		time: ''
		period: ''
		anytime: true
	$scope.end =
		date: ''
		time: ''
		period: ''
		anytime: true
	$scope.errors =
		type: []
		reason: []
	$scope.times = []

	$scope.selectedWidget = null
	$scope.$on 'selectedWidget.update', (evt) ->
		$scope.selectedWidget = selectedWidgetSrv.get()
		console.log($scope.selectedWidget)

	init = (gateway) ->

	popup = ->
		# Gets the game id for use in the api
		selected = $scope.selectedWidget
		gameId = selected.id
		console.log("gameId: " + gameId)

		# Sets the start/end dates
		$scope.dateFormatter()
		console.log $scope.start
		console.log $scope.end


	# Formats the dates based on the range given
	# @var string none/to/from/toFrom
	# @return array start and end dates
	$scope.dateFormatter = ->
		open = $scope.selectedWidget.open_at
		close = $scope.selectedWidget.close_at
		startDate = if open > -1 then new Date(open * 1000) else null
		endDate = if close > -1 then new Date(close * 1000) else null

		# If start variable exists, then populate the start elements with information
		console.log "Start and end info"
		console.log $scope.selectedWidget
		if startDate
			month = startDate.getMonth() + 1
			date = startDate.getDate()
			year = startDate.getUTCFullYear().toString().substr(2,2)
			$scope.start.date = month + "/" + date + "/" + year
			hours = startDate.getHours()
			if hours > 11
				hours = hours - 12
				period = "pm"
			else
				period = "am"
			minutes = startDate.getMinutes()
			minutes = if minutes < 10 then "0" + minutes else minutes
			$scope.start.time = hours + ":" + minutes
			$scope.start.period = period
			$scope.start.anytime = false

		# If end variable exists, then populate the end elements with information
		if endDate
			month = endDate.getMonth() + 1
			date = endDate.getDate()
			year = endDate.getUTCFullYear().toString().substr(2,2)
			$scope.end.date = month + "/" + date + "/" + year
			hours = endDate.getHours()
			if hours > 11
				hours = hours - 12
				period = "pm"
			else
				period = "am"
			minutes = endDate.getMinutes()
			minutes = if minutes < 10 then "0" + minutes else minutes
			$scope.end.time = hours + ":" + minutes
			$scope.end.period = period
			$scope.end.anytime = false

		# If the time is blured without minutes set, add :00 (so 2 becomes 2:00)
	$scope.checkTime = () ->
		if $scope.start.time.indexOf(":") == -1 && $scope.start.time != ''
			$scope.start.time += ":00"
		if $scope.end.time.indexOf(":") == -1 && $scope.end.time != ''
			$scope.end.time += ":00"

	$scope.changePeriod = (start, period) ->
		if start
			$scope.start.period = period
		else
			$scope.end.period = period

	$scope.setSlider = ->
		idNum = $scope.selectedWidget.attempts
		if idNum == '-1'
			idNum = 25
		realNum = parseInt(idNum, 10)*1000
		$( ".selector" ).slider 'value', realNum

	# Validates the availability info and adds error code
	$scope.parseSubmittedInfo = ->
		$scope.errors.type = []
		$scope.errors.reason = []
		$scope.times = []
		success = true
		ranges = [$scope.start, $scope.end]
		i = 0

		# For each option checked.
		for range in ranges
			date = range.date
			period = range.period
			time = range.time
			anytime = range.anytime

			# Variables to check that the entered time is in a valid format.
			if time?
				hourMinute = time.split(":")
				console.log hourMinute
			if hourMinute[0] == ''
				hourLength = true
			else
				hourLength = hourMinute[0].length < 3
			console.log(hourLength)

			if hourMinute[1]?
				if hourMinute[1] == ''
					minuteLength = true
				else
					minuteLength = hourMinute[1].length < 3
			hourBounds = Number(hourMinute[0]) < 13
			minuteBounds = Number(hourMinute[1]) < 60

			# if anytime was selected, then the times value will be negative one.
			if anytime == true
				$scope.times[i] = -1
			else
				if date == ''
					success = false
					if $scope.errors.type.indexOf('Date') < 0
						$scope.errors.type.push 'Date'
					if $scope.errors.reason.indexOf('missing') < 0
						$scope.errors.reason.push 'missing'
				else if !hourLength or !minuteLength or !hourBounds or !minuteBounds or !time.match /[0-9]{1,2}:[0-9]{2}/
					success = false
					if $scope.errors.type.indexOf('Time') < 0
						$scope.errors.type.push 'Time'

					if time == ''
						if $scope.errors.reason.indexOf('missing') < 0
							$scope.errors.reason.push 'missing'
					else if $scope.errors.reason.indexOf('invalid') < 0
						$scope.errors.reason.push 'invalid'

				else
					fullDate = date + " " + time + period
					console.log fullDate
					$scope.times.push Date.parse(fullDate).getTime()/1000

			i++

		console.log $scope.errors
		console.log $scope.times
		if $scope.errors.type.length < 1
			$scope.changeAvailability()
		return

	# Handles the api calls to actually change the availability
	# @return void
	$scope.changeAvailability = (callback) ->
		# Update the widget instance.
		console.log "change"
		console.log($scope.selectedWidget)
		console.log($scope.times)

		widgetSrv.saveWidget
			inst_id: $scope.selectedWidget.id,
			open_at: $scope.times[0],
			close_at: $scope.times[1],
			attempts: 15
			, (widget) ->
			# Repopuplates the availability and attempts on the main page
			Materia.MyWidgets.SelectedWidget.populateAvailability $scope.times[0], $scope.times[1]
			Materia.MyWidgets.SelectedWidget.populateAttempts parseInt(15, 10)
			if callback
				callback()


	Namespace('Materia.MyWidgets').Availability =
		init  : init
		popup : popup
