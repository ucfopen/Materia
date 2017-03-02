app = angular.module 'materia'
# The widget settings/availability modal on My Widgets
app.controller 'WidgetSettingsController', ($scope, $filter, $window, selectedWidgetSrv, widgetSrv, Alert) ->

	$scope.alert = Alert

	# Sets up the slider for availability
	$scope.setupSlider = ->
		# The values are huge for smooth slidyness
		$('.selector').slider
			value: $scope.attemptsSliderValue * 1000
			min: 1000
			max: 25000
			disabled: $scope.guestAccess
			create: (event) ->
				$scope.changeSlider($scope.attemptsSliderValue)
				# remove the href, since clicking on it (when disabled) refreshes the page
				$(".selector .ui-slider-handle").removeAttr('href')
			slide: (event, ui) ->
				$scope.updateSlider(ui.value)
			stop: (event, ui) ->
				$scope.updateSlider(ui.value)

	# Sets up the date pickers for the availability times
	$scope.setupDatePickers = ->
		$(".date.from").datepicker
			onSelect: (dateText) ->
				$scope.availability[0].date = dateText

		$(".date.to").datepicker
			onSelect: (dateText) ->
				$scope.availability[1].date = dateText

	$scope.toggleNormalAccess = ->
		if $scope.guestAccess = true then $scope.guestAccess = false
		if $scope.embeddedOnly = true then $scope.embeddedOnly = false

	$scope.toggleGuestAccess = ->
		return if $scope.studentMade

		$scope.guestAccess = !$scope.guestAccess
		if $scope.guestAccess then $scope.embeddedOnly = false
		if $scope.selected.widget.student_access is true and $scope.guestAccess is false
			$scope.alert.msg = 'Warning: Disabling Guest Mode will automatically revoke access to this widget for any students it has been shared with!'
			$scope.alert.title = 'Students with access will be removed'
			$scope.alert.fatal = false

		$scope.attemptsSliderValue = $scope.UNLIMITED_SLIDER_VALUE
		setTimeout ->
			$( ".selector" ).slider
				value: ($scope.attemptsSliderValue * 1000)
				disabled: $scope.guestAccess
		,0
		
	$scope.toggleEmbeddedOnly = ->
		return if $scope.studentMade

		$scope.embeddedOnly = !$scope.embeddedOnly
		if $scope.embeddedOnly then $scope.guestAccess = false

	# Fills in the dates from the selected widget
	$scope.dateFormatter = ->
		open = $scope.selected.widget.open_at
		close = $scope.selected.widget.close_at
		dates = [
			if open > -1 then new Date(open * 1000) else null
			if close > -1 then new Date(close * 1000) else null
		]
		i = 0

		for date in dates
			if date
				$scope.availability[i].date = $filter('date')(date, "MM/dd/yyyy")
				$scope.availability[i].time = $filter('date')(date, "h:mm")
				$scope.availability[i].period = $filter('date')(date, "a").toLowerCase()
				$scope.availability[i].anytime = false
			else
				$scope.availability[i].date = ''
				$scope.availability[i].time = ''
				$scope.availability[i].period = ''
				$scope.availability[i].anytime = true
			i++

	# If the time is blurred without minutes set, add :00 (so 2 becomes 2:00)
	$scope.checkTime = (index) ->
		if $scope.availability[index].time.indexOf(":") == -1 && $scope.availability[index].time != ''
			$scope.availability[index].time += ":00"
		if !$scope.availability[index].period
			$scope.availability[index].period = "am"

	# Moves the slider to the specified value and updates the attempts.
	# From ng-click on the attempt numbers below the slider.
	$scope.changeSlider = (number) ->
		if $scope.guestAccess
			# always should be set to unlimited (-1)
			number = -1

		if number == -1
			val = 1000
		else
			val = number
		$( ".selector" ).slider 'value', (val * 1000)
		$scope.attemptsSliderValue = number

	# Updates the slider based on which value the slider is close to.
	# It will "click" into place when in between the steps.
	$scope.updateSlider = (value) ->
		smaller = Math.round(value/1000)
		if smaller > 5
			smaller = 5 * Math.round(smaller/5)
		$scope.attemptsSliderValue = smaller
		$( ".selector" ).slider 'value', (smaller * 1000)
		$scope.$apply()

	# Validates the availability info and adds error code
	# TODO: Find a better way to do errors.
	$scope.parseSubmittedInfo = ->
		# Reset all of the variables
		$scope.error = ""
		$scope.times = []
		ranges = [$scope.availability[0], $scope.availability[1]]
		i = 0
		$scope.dateError = [false, false]
		$scope.timeError = [false, false]
		errors =
			date: 0
			time: 0
			missing: 0
			invalid: 0

		for range in ranges
			date = range.date
			period = if range.period then range.period else 'am'
			time = range.time
			anytime = range.anytime
			# if anytime was selected, then the times value will be negative one.
			if anytime == true
				$scope.times[i] = -1
			else
				monthDayYear = date.split("/")
				if monthDayYear? and monthDayYear.length == 3
					if monthDayYear[0].length > 2 or monthDayYear[1].length > 2 or monthDayYear[2].length > 4
						errors.date++
						errors.invalid++
						$scope.dateError[i] = true
					else
						fullDate = date + " " + time + period
				else
					errors.date++
					errors.missing++
					$scope.dateError[i] = true
				# Variables to check that the entered time is in a valid format.
				hourMinute = time.split(":")
				if hourMinute[0] != '' && hourMinute[1] != ''
					hourValid = hourMinute[0].length < 3 and Number(hourMinute[0]) < 13
					minuteValid = hourMinute[1].length < 3 and Number(hourMinute[1]) < 60
					if !hourValid or !minuteValid or !time.match /[0-9]{1,2}:[0-9]{2}/
						errors.time++
						errors.invalid++
						$scope.timeError[i] = true
					else
						$scope.times.push Date.parse(date +  " " + time + " " + period)/1000
				else
					errors.time++
					errors.missing++
					$scope.timeError[i] = true
			i++
		# Build the error string.
		# Huge mess because there are a ton of cases.
		if errors.date > 0 or errors.time > 0
			$scope.error = 'The'
			if errors.date > 0 then $scope.error += " date"
			if errors.date > 1 then $scope.error += "s"
			if errors.time > 0 and errors.date > 0 then $scope.error += " and"
			if errors.time > 0 then $scope.error += " time"
			if errors.time > 1 then $scope.error += "s"
			if errors.date > 0 and errors.time > 0 or errors.date > 1 or errors.time > 1
				$scope.error += " are "
			else
				$scope.error += " is "
			if errors.invalid > 0 then $scope.error += "invalid"
			if errors.invalid > 0 and errors.missing > 0 then $scope.error += "/"
			if errors.missing > 0 then $scope.error += "missing"
			$scope.error += "."

		if $scope.error == '' and $scope.times[0] > $scope.times[1] and $scope.times[1] != -1
			$scope.error = "The widget cannot be closed before it becomes available."

		if $scope.error == ''
			$scope.changeAvailability()
		return

	# Handles the api calls to actually change the availability
	# @return void
	$scope.changeAvailability = ->
		# Close the modal
		this.$parent.hideModal()
		attempts = if $scope.attemptsSliderValue < $scope.UNLIMITED_SLIDER_VALUE then $scope.attemptsSliderValue else -1

		# Update the widget instance.
		widgetSrv.saveWidget
			inst_id: $scope.selected.widget.id,
			open_at: $scope.times[0],
			close_at: $scope.times[1],
			attempts: attempts,
			guest_access: $scope.guestAccess,
			embedded_only: $scope.embeddedOnly
			, (widget) ->
				$scope.$broadcast 'widgetAvailability.update', ''
				selectedWidgetSrv.updateAvailability(attempts, $scope.times[0], $scope.times[1], $scope.guestAccess, $scope.embeddedOnly)

	$scope.UNLIMITED_SLIDER_VALUE = 25
	$scope.times = []
	$scope.error = ''
	# Keeps track of which inputs have errors so the error class can be added correctly.
	$scope.dateError = [false, false]
	$scope.timeError = [false, false]
	# Default to unlimited attempts
	$scope.attemptsSliderValue = $scope.UNLIMITED_SLIDER_VALUE
	# Hold information for availability.
	$scope.availability = []
	$scope.guestAccess = false
	$scope.isEmbedded = $scope.selected.widget.is_embedded
	$scope.embeddedOnly = $scope.selected.widget.embedded_only
	$scope.studentMade = $window.IS_STUDENT or $scope.selected.widget.is_student_made
	# From
	$scope.availability.push
		header: 'Available'
		anytimeLabel: 'Now'
		anytime: true
	# To
	$scope.availability.push
		header: 'Closes'
		anytimeLabel: 'Never'
		anytime: true

	$scope.error = ''
	$scope.dateError = [false, false]
	$scope.timeError = [false, false]

	$scope.attemptsSliderValue = parseInt $scope.selected.widget.attempts

	if $scope.studentMade
		# force guestAccess on for students or student made widgets
		$scope.guestAccess = true
	else
		# use the widget's settings if not student made
		$scope.guestAccess = $scope.selected.widget.guest_access

	$scope.dateFormatter()
	setTimeout ->
		$scope.setupSlider()
		$scope.setupDatePickers()
	, 1

	null