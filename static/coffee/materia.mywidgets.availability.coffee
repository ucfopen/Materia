MyWidgets = angular.module 'MyWidgets'
MyWidgets.controller 'WidgetSettingsController', ($scope, selectedWidgetSrv, widgetSrv) ->
	$scope.range = ''
	$scope.inst = []
	$scope.startDate = false
	$scope.endDate = false
	$scope.availability = []
	$scope.availability.push
		header: 'Available'
		anytimeLabel: 'Now'
		date: ''
		time: ''
		period: ''
		anytime: true
	$scope.availability.push
		header: 'Closes'
		anytimeLabel: 'Never'
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

	init = (gateway) ->

	popup = ->
		# Sets the start/end dates
		$scope.dateFormatter()
		$(".date.from").datepicker
			maxDate: $scope.availability[0].date
			onSelect: (dateText, inst) ->
				$('.date.to').datepicker 'option', {minDate: dateText}
				$scope.availability[0].date = dateText

		$(".date.to").datepicker
			minDate: $scope.availability[1].date
			onSelect: (dateText, inst) ->
				$('.date.from').datepicker 'option', {maxDate: dateText}
				$scope.availability[1].date = dateText


	# Formats the dates
	$scope.dateFormatter = ->
		open = $scope.selectedWidget.open_at
		close = $scope.selectedWidget.close_at
		dates = [
			if open > -1 then new Date(open * 1000) else null
			if close > -1 then new Date(close * 1000) else null
		]
		i = 0

		for date in dates
			if date
				month = date.getMonth() + 1
				day = date.getDate()
				year = date.getUTCFullYear().toString().substr(2,2)
				hours = date.getHours()
				if hours > 11
					hours = hours - 12
					period = "pm"
				else
					period = "am"
				minutes = date.getMinutes()
				minutes = if minutes < 10 then "0" + minutes else minutes
				$scope.availability[i].date = month + "/" + day + "/" + year
				$scope.availability[i].time = hours + ":" + minutes
				$scope.availability[i].period = period
				$scope.availability[i].anytime = false
				i++
			else
				$scope.availability[i].date = ''
				$scope.availability[i].time = ''
				$scope.availability[i].period = ''
				$scope.availability[i].anytime = true

	# If the time is blurred without minutes set, add :00 (so 2 becomes 2:00)
	$scope.checkTime = (index) ->
		if $scope.availability[index].time.indexOf(":") == -1 && $scope.availability[index].time != ''
			$scope.availability[index].time += ":00"

	$scope.changePeriod = (index, period) ->
		$scope.availability[index].period = period

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
		ranges = [$scope.availability[0], $scope.availability[1]]
		i = 0

		# For each option checked.
		for range in ranges
			date = range.date
			period = range.period ? range.period : 'am'
			time = range.time
			anytime = range.anytime

			# Variables to check that the entered time is in a valid format.
			if time?
				hourMinute = time.split(":")
			if hourMinute[0] == ''
				hourLength = true
			else
				hourLength = hourMinute[0].length < 3

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
