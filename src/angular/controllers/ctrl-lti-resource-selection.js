const app = angular.module('materia')
app.controller('LTIResourceSelectionCtrl', function (
	Please,
	$interval,
	$timeout,
	$scope,
	$sce,
	WidgetSrv
) {
	const REFRESH_FAKE_DELAY_MS = 500
	const CHANGE_SECTION_FADE_DELAY_MS = 250
	let selectedWidget = null
	let widgetsLoaded = false

	const _calloutRefreshLink = () => {
		$scope.showRefreshArrow = true
	}

	const loadWidgets = (fakeDelay) => {
		if (fakeDelay == null) {
			fakeDelay = 1
		}

		$timeout(
			() =>
				WidgetSrv.getWidgets(true).then((widgets) => {
					if (widgets != null ? widgets.halt : undefined) {
						return
					}
					if (!widgets) {
						widgets = []
					}

					widgetsLoaded = true

					const len = widgets.length
					const curWidget = null

					for (let widget of Array.from(widgets)) {
						widget.img = Materia.Image.iconUrl(widget.widget.dir, 60)
						widget.preview_url = BASE_URL + 'preview/' + widget.id
						widget.edit_url = BASE_URL + 'my-widgets/#' + widget.id
					}

					$scope.widgets = widgets
					Please.$apply()
				}),

			fakeDelay
		)
	}

	const _highlight = (widget) => {
		for (let w of Array.from($scope.widgets)) {
			w.selected = false
		}
		widget.selected = true
	}

	const _embedWidget = (widget) => {
		if (selectedWidget && selectedWidget.state && selectedWidget.state === 'pending') {
			return
		}

		selectedWidget = widget
		selectedWidget.state = 'pending'

		widget.img = Materia.Image.iconUrl(widget.widget.dir, 60)
		$scope.selectedWidget = widget

		setDisplayState('progress')
	}

	const finishProgressBarAndSetLocation = () => {
		let pg = document.querySelector('.progress-container')
		let pgSpan = document.querySelector('.progress-container span')
		pg.classList.add('success')
		pgSpan.innerText = 'Success!'

		$timeout(() => {
			announceChoice()

			// RETURN_URL is sent from the Tool Consumer at the time of LTI Launch
			// provided by launch_presentation_return_url or content_item_return_url
			// if RETURN_URL is set, we'll use it to inform the LTI Tool consumer of our choice
			if (typeof RETURN_URL !== 'undefined' && RETURN_URL !== null) {
				// add a ? or & depending on RETURN_URL already containing query params
				const seperator = RETURN_URL.includes('?') ? '&' : '?'
				// endode the url
				const url = encodeURI(selectedWidget.embed_url)
				// redirect the client to the return url with our new variables
				window.location = `${RETURN_URL}${seperator}embed_type=basic_lti&url=${url}`
			}
		}, 1000)
	}

	const setDisplayState = (newSection) => {
		$scope.section = newSection
		$timeout(() => {
			let body = document.querySelector('body')
			body.classList.remove('selectWidget')
			body.classList.remove('widgetSelected')
			body.classList.remove('progress')
			body.classList.add(newSection)

			if (newSection === 'selectWidget') {
				if (selectedWidget != null) {
					let cancel = document.querySelector('.cancel-button')
					cancel.style.display = 'block'
				}

				if (!widgetsLoaded) {
					loadWidgets()
				}
			} else if (newSection === 'progress') {
				startProgressBar()
			}
		}, 0)
	}

	const getRandInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

	const startProgressBar = () => {
		// create a random number of progress bar stops
		const availStops = [1, 2, 3, 4, 5, 6, 7, 8, 9]
		const stops = { tick: 0 }
		const len = getRandInt(3, 5)
		let fill = document.querySelector('.progressbar>.fill')

		for (let i = 0, end = len, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
			stops[availStops.splice(getRandInt(0, availStops.length), 1)] = true
		}

		var intervalId = $interval(() => {
			stops.tick++
			if (stops[stops.tick] != null) {
				fill.style.width = `${stops.tick * 10}%`
			}

			if (stops.tick >= 10) {
				fill.style.width = '100%'
				$interval.cancel(intervalId)
				finishProgressBarAndSetLocation()
			}
		}, 200)

		document.addEventListener('keyup', (event) => {
			if (event.keyCode === 16) {
				$scope.easterMode = true
				Please.$apply()
			}
		})
	}

	const getAvailabilityStr = (startDate, endDate) => {
		const availability = WidgetSrv.convertAvailibilityDates(startDate, endDate)

		if (endDate < 0 && startDate < 0) {
			return 'Anytime'
		} else if (startDate < 0 && endDate > 0) {
			return `Open until ${availability.end.date} at ${availability.end.time}`
		} else if (startDate > 0 && endDate < 0) {
			return `Anytime after ${availability.start.date} at ${availability.start.time}`
		} else {
			return `From ${availability.start.date} at ${availability.start.time} until ${availability.end.date} at  ${availability.end.time}`
		}
	}

	const announceChoice = () => {
		const widgetData = $scope.selectedWidget
		delete widgetData.element
		delete widgetData.searchCache

		// the host system can listen for this postMessage "message" event:
		if (JSON.stringify && parent.postMessage) {
			parent.postMessage(JSON.stringify(widgetData), '*')
		}
	}

	const _refreshListing = () => {
		$scope.showRefreshArrow = false
		loadWidgets(REFRESH_FAKE_DELAY_MS)
	}

	// expose to scope

	$scope.strHeader = system ? `Select a Widget for use in ${system}:` : 'Select a Widget:'
	$scope.query = {}
	$scope.refreshListing = _refreshListing
	$scope.highlight = _highlight
	$scope.embedWidget = _embedWidget
	$scope.calloutRefreshLink = _calloutRefreshLink

	// initialize

	setDisplayState('selectWidget')
})
