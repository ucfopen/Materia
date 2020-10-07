const app = angular.module('materia')
// The widget settings/availability modal on My Widgets
app.controller('MyWidgetsSettingsController', function (
	Please,
	$rootScope,
	$scope,
	$timeout,
	$filter,
	$window,
	SelectedWidgetSrv,
	WidgetSrv,
	Alert
) {
	let currentlySubmitting = false

	// Sets up the slider for availability
	const _setupSlider = () =>
		// The values are huge for smooth slidyness
		$('.selector').slider({
			value: $scope.attemptsSliderValue * 1000,
			min: 1000,
			max: 25000,
			disabled: $scope.guestAccess,
			create(event) {
				$scope.changeSlider($scope.attemptsSliderValue)
				// remove the href, since clicking on it (when disabled) refreshes the page
				$('.selector .ui-slider-handle').removeAttr('href')
			},
			slide(event, ui) {
				$scope.updateSlider(ui.value)
			},
			stop(event, ui) {
				$scope.updateSlider(ui.value)
			},
		})

	// Sets up the date pickers for the availability times
	const _setupDatePickers = () => {
		$('.date.from').datepicker({
			onSelect(dateText) {
				$scope.availability[0].date = dateText
			},
		})

		$('.date.to').datepicker({
			onSelect(dateText) {
				$scope.availability[1].date = dateText
			},
		})
	}

	const _toggleNormalAccess = () => {
		// disallow student made widgets from being toggled out of guest mode
		if ($scope.studentMade) return

		$scope.guestAccess = !$scope.guestAccess

		if ($scope.embeddedOnly == true) {
			$scope.embeddedOnly = false
		}

		// warn user that students will be removed if guest mode is disabled
		if ($scope.selected.widget.student_access == true && $scope.guestAccess == false) {
			$scope.alert.msg =
				'Warning: Disabling Guest Mode will automatically revoke access to this widget for any students it has been shared with!'
			$scope.alert.title = 'Students with access will be removed'
			$scope.alert.fatal = false
		}

		_updateSliderAfterChange()
	}

	const _toggleGuestAccess = () => {
		// disallow student made widgets from being toggled out of guest mode
		if ($scope.studentMade) return

		$scope.guestAccess = !$scope.guestAccess
		if ($scope.guestAccess) {
			$scope.embeddedOnly = false
		}

		// warn user that students will be removed if guest mode is disabled
		if ($scope.selected.widget.student_access == true && $scope.guestAccess == false) {
			$scope.alert.msg =
				'Warning: Disabling Guest Mode will automatically revoke access to this widget for any students it has been shared with!'
			$scope.alert.title = 'Students with access will be removed'
			$scope.alert.fatal = false
		}

		$scope.attemptsSliderValue = $scope.UNLIMITED_SLIDER_VALUE

		_updateSliderAfterChange()
	}

	const _toggleEmbeddedOnly = () => {
		if ($scope.studentMade) return

		$scope.embeddedOnly = !$scope.embeddedOnly
		if ($scope.embeddedOnly) {
			$scope.guestAccess = false
		}

		_updateSliderAfterChange()
	}

	// this probably shouldn't have to be used
	// because the toggles above should be just one
	// function lilke _setAccess()
	const _updateSliderAfterChange = () => {
		$timeout(() => {
			$('.selector').slider({
				value: $scope.attemptsSliderValue * 1000,
				disabled: $scope.guestAccess,
			})
		})
	}

	// Fills in the dates from the selected widget
	const _dateFormatter = () => {
		const open = $scope.selected.widget.open_at
		const close = $scope.selected.widget.close_at
		const dates = [
			open > -1 ? new Date(open * 1000) : null,
			close > -1 ? new Date(close * 1000) : null,
		]

		dates.forEach((date, i) => {
			if (date) {
				$scope.availability[i].date = $filter('date')(date, 'MM/dd/yyyy')
				$scope.availability[i].time = $filter('date')(date, 'h:mm')
				$scope.availability[i].period = $filter('date')(date, 'a').toLowerCase()
				$scope.availability[i].anytime = false
			} else {
				$scope.availability[i].date = ''
				$scope.availability[i].time = ''
				$scope.availability[i].period = ''
				$scope.availability[i].anytime = true
			}
		})
	}

	// If the time is blurred without minutes set, add :00 (so 2 becomes 2:00)
	const _checkTime = (index) => {
		if (
			$scope.availability[index].time.indexOf(':') === -1 &&
			$scope.availability[index].time !== ''
		) {
			$scope.availability[index].time += ':00'
		}
		if (!$scope.availability[index].period) {
			$scope.availability[index].period = 'am'
		}
	}

	// Moves the slider to the specified value and updates the attempts.
	// From ng-click on the attempt numbers below the slider.
	const _changeSlider = (number) => {
		let val
		if ($scope.guestAccess) {
			// always should be set to unlimited (-1)
			number = -1
		}

		if (number === -1) {
			val = 1000
		} else {
			val = number
		}
		$('.selector').slider('value', val * 1000)
		$scope.attemptsSliderValue = number
	}

	// Updates the slider based on which value the slider is close to.
	// It will "click" into place when in between the steps.
	const _updateSlider = (value) => {
		let smaller = Math.round(value / 1000)
		if (smaller > 5) {
			smaller = 5 * Math.round(smaller / 5)
		}
		$scope.attemptsSliderValue = smaller
		$('.selector').slider('value', smaller * 1000)
		Please.$apply()
	}

	// Validates the availability info and adds error code
	// TODO: Find a better way to do errors.
	const _parseSubmittedInfo = () => {
		if (currentlySubmitting) return

		// Reset all of the variables
		let i = 0
		let date
		let time
		const ranges = [$scope.availability[0], $scope.availability[1]]
		const errors = {
			date: 0,
			time: 0,
			missing: 0,
			invalid: 0,
		}
		$scope.error = ''
		$scope.times = []
		$scope.dateError = [false, false]
		$scope.timeError = [false, false]

		for (let range of Array.from(ranges)) {
			;({ date } = range)
			const period = range.period ? range.period : 'am'
			;({ time } = range)
			const { anytime } = range
			// if anytime was selected, then the times value will be negative one.
			if (anytime === true) {
				$scope.times[i] = -1
			} else {
				const monthDayYear = date.split('/')
				if (monthDayYear != null && monthDayYear.length === 3) {
					if (
						monthDayYear[0].length > 2 ||
						monthDayYear[1].length > 2 ||
						monthDayYear[2].length > 4
					) {
						errors.date++
						errors.invalid++
						$scope.dateError[i] = true
					} else {
						const fullDate = date + ' ' + time + period
					}
				} else {
					errors.date++
					errors.missing++
					$scope.dateError[i] = true
				}
				// Variables to check that the entered time is in a valid format.
				const hourMinute = time.split(':')
				if (hourMinute[0] !== '' && hourMinute[1] !== '') {
					const hourValid = hourMinute[0].length < 3 && Number(hourMinute[0]) < 13
					const minuteValid = hourMinute[1].length < 3 && Number(hourMinute[1]) < 60
					if (!hourValid || !minuteValid || !time.match(/[0-9]{1,2}:[0-9]{2}/)) {
						errors.time++
						errors.invalid++
						$scope.timeError[i] = true
					} else {
						$scope.times.push(Date.parse(date + ' ' + time + ' ' + period) / 1000)
					}
				} else {
					errors.time++
					errors.missing++
					$scope.timeError[i] = true
				}
			}
			i++
		}
		// Build the error string.
		// Huge mess because there are a ton of cases.
		if (errors.date > 0 || errors.time > 0) {
			$scope.error = 'The'
			if (errors.date > 0) {
				$scope.error += ' date'
			}
			if (errors.date > 1) {
				$scope.error += 's'
			}
			if (errors.time > 0 && errors.date > 0) {
				$scope.error += ' and'
			}
			if (errors.time > 0) {
				$scope.error += ' time'
			}
			if (errors.time > 1) {
				$scope.error += 's'
			}
			if ((errors.date > 0 && errors.time > 0) || errors.date > 1 || errors.time > 1) {
				$scope.error += ' are '
			} else {
				$scope.error += ' is '
			}
			if (errors.invalid > 0) {
				$scope.error += 'invalid'
			}
			if (errors.invalid > 0 && errors.missing > 0) {
				$scope.error += '/'
			}
			if (errors.missing > 0) {
				$scope.error += 'missing'
			}
			$scope.error += '.'
		}

		if ($scope.error === '' && $scope.times[0] > $scope.times[1] && $scope.times[1] !== -1) {
			$scope.error = 'The widget cannot be closed before it becomes available.'
		}

		if ($scope.error === '') {
			currentlySubmitting = true
			$scope.changeAvailability()
		} else {
			currentlySubmitting = false
		}
	}

	// Handles the api calls to actually change the availability
	// @return void
	const _changeAvailability = () => {
		const attempts =
			$scope.attemptsSliderValue < $scope.UNLIMITED_SLIDER_VALUE ? $scope.attemptsSliderValue : -1

		// Update the widget instance.
		WidgetSrv.saveWidget({
			inst_id: $scope.selected.widget.id,
			open_at: $scope.times[0],
			close_at: $scope.times[1],
			attempts,
			guest_access: $scope.guestAccess,
			embedded_only: $scope.embeddedOnly,
		})
			.then((widget) => {
				SelectedWidgetSrv.set(widget)
				$rootScope.$broadcast('widgetList.update')
				currentlySubmitting = false
			})
			.catch(() => {
				currentlySubmitting = false
			})
	}

	// expose to scope

	$scope.UNLIMITED_SLIDER_VALUE = 25
	$scope.times = []
	$scope.error = ''
	// Keeps track of which inputs have errors so the error class can be added correctly.
	$scope.dateError = [false, false]
	$scope.timeError = [false, false]
	// Default to unlimited attempts
	$scope.attemptsSliderValue = $scope.UNLIMITED_SLIDER_VALUE
	// Hold information for availability.
	$scope.availability = []
	$scope.guestAccess = false
	$scope.isEmbedded = $scope.selected.widget.is_embedded
	$scope.embeddedOnly = $scope.selected.widget.embedded_only
	$scope.studentMade = $window.IS_STUDENT || $scope.selected.widget.is_student_made
	// From
	$scope.availability.push({
		header: 'Available',
		anytimeLabel: 'Now',
		anytime: true,
	})
	// To
	$scope.availability.push({
		header: 'Closes',
		anytimeLabel: 'Never',
		anytime: true,
	})

	$scope.error = ''
	$scope.dateError = [false, false]
	$scope.timeError = [false, false]

	$scope.setupSlider = _setupSlider
	$scope.setupDatePickers = _setupDatePickers
	$scope.toggleNormalAccess = _toggleNormalAccess
	$scope.toggleGuestAccess = _toggleGuestAccess
	$scope.toggleEmbeddedOnly = _toggleEmbeddedOnly
	$scope.dateFormatter = _dateFormatter
	$scope.checkTime = _checkTime
	$scope.changeSlider = _changeSlider
	$scope.updateSlider = _updateSlider
	$scope.parseSubmittedInfo = _parseSubmittedInfo
	$scope.changeAvailability = _changeAvailability
	$scope.alert = Alert
	$scope.attemptsSliderValue = parseInt($scope.selected.widget.attempts, 10)

	// initialize

	if ($scope.studentMade) {
		// force guestAccess on for students or student made widgets
		$scope.guestAccess = true
	} else {
		// use the widget's settings if not student made
		$scope.guestAccess = $scope.selected.widget.guest_access
	}

	_dateFormatter()
	$timeout(() => {
		$scope.setupSlider()
		$scope.setupDatePickers()
	}, 1)
})
