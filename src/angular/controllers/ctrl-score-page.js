const app = angular.module('materia')
app.controller('ScorePageController', function (Please, $scope, $q, $timeout, WidgetSrv, ScoreSrv) {
	const COMPARE_TEXT_CLOSE = 'Close Graph'
	const COMPARE_TEXT_OPEN = 'Compare With Class'
	// attempts is an array of attempts, [0] is the newest
	const attempt_dates = []
	const details = []
	// current attempt is the index of the attempt (the 1st attempt is attempts.length)
	let currentAttempt = null
	let widgetInstance = null
	let attemptsLeft = 0
	let single_id = window.location.hash.split('single-')[1]
	// @TODO @IE8 This method of checking for isEmbedded is hacky, but
	// IE8 didn't like "window.self == window.top" (which also might be
	// problematic with weird plugins that put the page in an iframe).
	// This should work pretty well but if we ever decide to change the
	// scores embed URL this will need to be modified!
	let isEmbedded = window.location.href.toLowerCase().indexOf('/scores/embed/') !== -1
	let isPreview = /\/preview\//i.test(document.URL)
	let _graphData = []

	// We don't want users who click the 'View more details' link via an LTI to play again, since at that point
	// the play will no longer be connected to the LTI details.
	// This is a cheap way to hide the button:
	let hidePlayAgain = document.URL.indexOf('details=1') > -1
	// get widget id from url like https://my-server.com:8080/scores/nLAmG#play-NbmVXrZe9Wzb
	const widget_id = document.URL.match(/^.+\/([a-z0-9]+)/i)[1]

	// this is only actually set to something when coming from the profile page
	let play_id = window.location.hash.split('play-')[1]

	let enginePath = null
	let qset = null
	let scoreWidget = null
	let scoreScreenInitialized = false
	let scoreTable = null
	let embedDonePromise = null
	let scoresLoadPromise = null
	let hashAllowUpdate = true

	const _displayScoreData = (inst_id, play_id) => {
		const deferred = $q.defer()
		WidgetSrv.getWidget(inst_id)
			.then((instance) => {
				widgetInstance = instance
				$scope.guestAccess = widgetInstance.guest_access
				if (_checkCustomScoreScreen()) _embed()
				// if ($scope.customScoreScreen) {
				// 	_embed()
				// }
				return inst_id
			})
			.then(_getInstanceScores)
			.then(() => {
				_displayAttempts(play_id, deferred)
				_displayWidgetInstance()
			})
			.catch(() => {})
		return deferred.promise
	}

	const _checkCustomScoreScreen = () => {
		$scope.customScoreScreen = false
		const score_screen = widgetInstance.widget.score_screen
		if (score_screen) {
			const splitSpot = score_screen.lastIndexOf('.')
			if (splitSpot != -1) {
				if (score_screen.substring(0, 4) == 'http') {
					// allow player paths to be absolute urls
					enginePath = score_screen
				} else {
					// link to the static file
					enginePath = WIDGET_URL + widgetInstance.widget.dir + score_screen
				}
				$scope.customScoreScreen = true
			}
		}
		return $scope.customScoreScreen
	}

	const _embed = () => {
		const deferred = $q.defer()
		embedDonePromise = deferred

		scoreWidget = document.querySelector('#container')
		$scope.htmlPath = enginePath + '?' + widgetInstance.widget.created_at
		$scope.type = 'html'

		// setup the postmessage listener
		window.addEventListener('message', _onPostMessage, false)
		Please.$apply()
	}

	const _onPostMessage = (e) => {
		const origin = `${e.origin}/`
		if (origin === STATIC_CROSSDOMAIN || origin === BASE_URL) {
			const msg = JSON.parse(e.data)
			switch (msg.source) {
				case 'score-core':
					switch (msg.type) {
						case 'start':
							return _onWidgetReady()
						case 'setHeight':
							return _setHeight(msg.data[0])
						case 'hideResultsTable':
							return ($scope.showResultsTable = false)
						case 'hideScoresOverview':
							return ($scope.showScoresOverview = false)
						case 'requestScoreDistribution':
							return _getScoreDistribution()
						default:
							console.warn(`Unknown PostMessage received from score core: ${msg.type}`)
							return false
					}

				case 'score-controller':
					switch (msg.type) {
						case 'materiaScoreRecorded':
							return false // let this one pass through, it's not intended for score-core but rather a parent platform (like Obojobo)
						default:
							console.warn(`Unknown PostMessage received from score controller: ${msg.type}`)
							return false
					}

				default:
					console.warn('Invalid postMessage source or no source provided')
					return false
			}
		} else {
			throw new Error(`Error, cross domain restricted for ${origin}`)
		}
	}

	const _getInstanceScores = (inst_id) => {
		const dfd = $q.defer()
		if (isPreview || single_id) {
			$scope.attempts = [{ id: -1, created_at: 0, percent: 0 }]
			dfd.resolve() // skip, preview doesn't support this
		} else if (!widgetInstance.guest_access) {
			// Want to get all of the scores for a user if the widget doesn't
			// support guests.
			const send_token =
				typeof LAUNCH_TOKEN !== 'undefined' && LAUNCH_TOKEN !== null ? LAUNCH_TOKEN : play_id
			ScoreSrv.getWidgetInstanceScores(inst_id, send_token, (result) => {
				_populateScores(result.scores)
				attemptsLeft = result.attempts_left
				dfd.resolve()
			})
		} else {
			// Only want score corresponding to play_id if guest widget
			ScoreSrv.getGuestWidgetInstanceScores(inst_id, play_id, (scores) => {
				_populateScores(scores)
				dfd.resolve()
			})
		}
		return dfd.promise
	}

	const _populateScores = (scores) => {
		if (scores === null || scores.length < 1) {
			if (single_id) {
				single_id = null
				_displayScoreData(widget_id, play_id)
			} else {
				//load up an error screen of some sort
				$scope.restricted = true
				$scope.show = true
				Please.$apply()
			}
			return
		}
		// Round scores
		for (let attemptScore of Array.from(scores)) {
			attemptScore.roundedPercent = String(parseFloat(attemptScore.percent).toFixed(2))
		}
		$scope.attempts = scores
		$scope.attempt = scores[0]
		Please.$apply()
	}

	const _getScoreDetails = () => {
		scoresLoadPromise = $q.defer()
		if (isPreview) {
			currentAttempt = 1
			ScoreSrv.getWidgetInstancePlayScores(null, widgetInstance.id, _displayDetails)
		} else if (single_id) {
			ScoreSrv.getWidgetInstancePlayScores(single_id, null, _displayDetails)
		} else {
			// get the current attempt from the url
			const hash = getAttemptNumberFromHash()
			if (currentAttempt === hash) {
				scoresLoadPromise.resolve()
			} else {
				currentAttempt = hash
				play_id = $scope.attempts[$scope.attempts.length - currentAttempt]['id']

				// display existing data or get more from the server
				if (details[$scope.attempts.length - currentAttempt] != null) {
					_displayDetails(details[$scope.attempts.length - currentAttempt])
				} else {
					ScoreSrv.getWidgetInstancePlayScores(play_id, null, _displayDetails)
				}
			}
		}

		Please.$apply()
		return scoresLoadPromise.promise
	}

	const _displayWidgetInstance = () => {
		// Build the data for the overview section, prep for display through Underscore
		const widget = {
			title: widgetInstance.name,
			dates: attempt_dates,
		}

		// show play again button?
		if (!single_id && (widgetInstance.attempts <= 0 || parseInt(attemptsLeft) > 0 || isPreview)) {
			const prefix = (() => {
				switch (false) {
					case !isEmbedded:
						return '/embed/'
					case !isPreview:
						return '/preview/'
					default:
						return '/play/'
				}
			})()

			widget.href = prefix + widgetInstance.id + '/' + widgetInstance.clean_name
			if (typeof LAUNCH_TOKEN !== 'undefined' && LAUNCH_TOKEN !== null) {
				widget.href += `?token=${LAUNCH_TOKEN}`
			}
			$scope.attemptsLeft = attemptsLeft
		} else {
			// if there are no attempts left, hide play again
			hidePlayAgain = true
		}

		// Modify display of several elements after HTML is outputted
		const lengthRange = Math.floor(widgetInstance.name.length / 10)
		let textSize = parseInt(document.querySelector('article.container header > h1').style.fontSize)
		let paddingSize = parseInt(
			document.querySelector('article.container header > h1').style.paddingTop
		)

		switch (lengthRange) {
			case 0:
			case 1:
			case 2:
				textSize -= 4
				paddingSize += 4
				break
			case 3:
				textSize -= 8
				paddingSize += 8
				break
			default:
				textSize -= 12
				paddingSize += 12
		}

		$scope.headerStyle = {
			'font-size': textSize,
			'padding-top': paddingSize,
		}

		$scope.hidePlayAgain = hidePlayAgain
		$scope.hidePreviousAttempts = single_id
		$scope.widget = widget
		Please.$apply()
	}

	const _displayAttempts = (play_id, deferred) => {
		if (isPreview) {
			currentAttempt = 1
			_getScoreDetails().then(() => {
				deferred.resolve()
			})
		} else {
			if ($scope.attempts instanceof Array && $scope.attempts.length > 0) {
				let matchedAttempt = false
				$scope.attempts.forEach((a, i) => {
					const d = new Date(a.created_at * 1000)

					// attempt_dates is used to populate the overview data in displayWidgetInstance, it's just assembled here.
					attempt_dates[i] = d.getMonth() + 1 + '/' + d.getDate() + '/' + d.getFullYear()

					if (play_id === a.id) {
						matchedAttempt = $scope.attempts.length - i
					}
				})

				if (isPreview) {
					window.location.hash = `#attempt-${1}`
					deferred.resolve()
					// we only want to do this if there's more than one attempt. Otherwise it's a guest widget
					// or the score is being viewed by an instructor, so we don't want to get rid of the playid
					// in the hash
				} else if (matchedAttempt !== false && $scope.attempts.length > 1) {
					// changing the hash will call _getScoreDetails()
					hashAllowUpdate = false
					window.location.hash = `#attempt-${matchedAttempt}`
					_getScoreDetails().then(() => {
						deferred.resolve()
					})
				} else if (getAttemptNumberFromHash() === undefined) {
					window.location.hash = `#attempt-${$scope.attempts.length}`
					deferred.resolve()
				} else {
					_getScoreDetails().then(() => {
						deferred.resolve()
					})
				}
			}
		}
	}

	// Uses jPlot to create the bargraph
	const _toggleClassRankGraph = () => {
		let graph = document.querySelector('section.score-graph')
		// toggle button text
		if ($scope.graphShown) {
			$scope.classRankText = COMPARE_TEXT_OPEN
			$scope.graphShown = false
			graph.classList.remove('open')
		} else {
			$scope.graphShown = true
			$scope.classRankText = COMPARE_TEXT_CLOSE
			graph.classList.add('open')
		}

		// return if graph already built
		if (_graphData.length > 0) {
			return
		}

		// return if preview
		if (isPreview) {
			return
		}

		// Dynamically load jqplot libraries at run time
		const cdnBase = '//cdnjs.cloudflare.com/ajax/libs/'
		return $LAB
			.script(`${cdnBase}jquery/3.3.1/jquery.min.js`)
			.wait()
			.script(`${cdnBase}jqPlot/1.0.9/jquery.jqplot.min.js`)
			.wait()
			.script(`${cdnBase}jqPlot/1.0.9/plugins/jqplot.barRenderer.min.js`)
			.script(`${cdnBase}jqPlot/1.0.9/plugins/jqplot.canvasTextRenderer.min.js`)
			.script(`${cdnBase}jqPlot/1.0.9/plugins/jqplot.canvasAxisTickRenderer.min.js`)
			.script(`${cdnBase}jqPlot/1.0.9/plugins/jqplot.categoryAxisRenderer.min.js`)
			.script(`${cdnBase}jqPlot/1.0.9/plugins/jqplot.cursor.min.js`)
			.script(`${cdnBase}jqPlot/1.0.9/plugins/jqplot.highlighter.min.js`)
			.wait(() =>
				// ========== BUILD THE GRAPH =============
				ScoreSrv.getWidgetInstanceScoreSummary(widgetInstance.id, (data) => {
					// add up all semesters data into one dataset
					_graphData = [
						['0-9%', 0],
						['10-19%', 0],
						['20-29%', 0],
						['30-39%', 0],
						['40-49%', 0],
						['50-59%', 0],
						['60-69%', 0],
						['70-79%', 0],
						['80-89%', 0],
						['90-100%', 0],
					]

					for (let d of Array.from(data)) {
						for (let n = 0; n < _graphData.length; n++) {
							const bracket = _graphData[n]
							bracket[1] += d.distribution[n]
						}
					}

					// setup options
					const jqOptions = {
						animate: true,
						animateReplot: true,
						series: [
							{
								renderer: $.jqplot.BarRenderer,
								shadow: false,
								color: '#1e91e1',
								rendererOptions: {
									animation: {
										speed: 500,
									},
								},
							},
						],
						seriesDefaults: {
							showMarker: false,
							pointLabels: {
								show: true,
								formatString: '%.0f',
								color: '#000',
							},
						},
						title: {
							text: "Compare Your Score With Everyone Else's",
							fontFamily: 'Lato, Lucida Grande, Arial, sans',
						},
						axesDefaults: {
							tickRenderer: $.jqplot.CanvasAxisTickRenderer,
							tickOptions: {
								angle: 0,
								fontSize: '8pt',
								color: '#000',
							},
						},
						axes: {
							xaxis: {
								renderer: $.jqplot.CategoryAxisRenderer,
								label: 'Score Percent',
							},
							yaxis: {
								tickOptions: { formatString: '%.1f', angle: 45 },
								label: 'Number of Scores',
								labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
								color: '#000',
							},
						},
						cursor: { show: false },
						grid: { shadow: false },
					}

					// light the fuse
					$.jqplot('graph', [_graphData], jqOptions)
				})
			)
	}

	const _displayDetails = (results) => {
		let score

		if (!$scope.customScoreScreen) {
			$scope.show = true
		}

		if (!results || !results[0]) {
			$scope.expired = true
			$scope.show = true
			Please.$apply()
			return
		}

		details[$scope.attempts.length - currentAttempt] = results
		const deets = results[0]

		// Round the score for display
		for (tableItem of Array.from(deets.details[0].table)) {
			score = parseFloat(tableItem.score)
			if (score !== 0 && score !== 100) {
				tableItem.score = score.toFixed(2)
			}
		}

		// send the materiaScoreRecorded postMessage
		// previously within the if block below, but should happen regardless of whether the overview is shown
		deets.overview.score = Math.round(deets.overview.score)
		sendPostMessage(deets.overview.score)

		if ($scope.showScoresOverview) {
			for (var tableItem of Array.from(deets.overview.table)) {
				if (tableItem.value.constructor === String) {
					tableItem.value = parseFloat(tableItem.value)
				}
				tableItem.value = tableItem.value.toFixed(2)
			}

			$scope.overview = deets.overview
			$scope.attempt_num = currentAttempt
		}
		if ($scope.showResultsTable) {
			$scope.details = deets.details
			$timeout(() => _addCircleToDetailTable(deets.details), 10)
		}

		$scope.dates = attempt_dates

		const referrerUrl = deets.overview.referrer_url
		if (
			deets.overview.auth === 'lti' &&
			referrerUrl &&
			referrerUrl.indexOf(`/scores/${widgetInstance.id}`) === -1
		) {
			$scope.playAgainUrl = referrerUrl
		} else {
			$scope.playAgainUrl = $scope.widget.href
		}
		Please.$apply()

		scoreTable = deets.details[0].table
		if ($scope.customScoreScreen) {
			const created_at = ~~deets.overview.created_at
			ScoreSrv.getWidgetInstanceQSet(play_id, widget_id, created_at, (data) => {
				if (
					(data != null ? data.title : undefined) === 'Permission Denied' ||
					data.title === 'error'
				) {
					$scope.invalid = true
					Please.$apply()
				} else {
					qset = data
				}

				return scoresLoadPromise.resolve()
			})
		} else {
			scoresLoadPromise.resolve()
		}
	}

	const _addCircleToDetailTable = (detail) => {
		detail.forEach((item, i) => {
			if (item.table && item.table.length) {
				item.table.forEach((table, j) => {
					let greyMode = false
					const index = j + 1
					const canvas_id = `question-${i + 1}-${index}`
					const percent = table.score / 100
					switch (table.graphic) {
						case 'modifier':
							greyMode = table.score === 0
							Materia.Scores.Scoregraphics.drawModifierCircle(canvas_id, index, percent, greyMode)
							break
						case 'final':
							Materia.Scores.Scoregraphics.drawFinalScoreCircle(canvas_id, index, percent)
							break
						case 'score':
							greyMode = table.score === -1
							Materia.Scores.Scoregraphics.drawScoreCircle(canvas_id, index, percent, greyMode)
							break
					}
				})
			}
		})
	}

	// broadcasts a postMessage to inform Obojobo, or other platforms, about a score event
	// Bypasses the LTI interface and provides an alternative for platforms that use embedded Materia to listen for a score
	const sendPostMessage = (score) => {
		if (parent.postMessage && JSON.stringify) {
			parent.postMessage(
				JSON.stringify({
					type: 'materiaScoreRecorded',
					source: 'score-controller',
					widget: widgetInstance,
					score,
				}),
				'*'
			)
		}
	}

	const getAttemptNumberFromHash = () => {
		const match = window.location.hash.match(/^#attempt-(\d+)/)
		if (match && match[1] != null && !isNaN(match[1])) {
			return match[1]
		}
		return $scope.attempts.length
	}

	const _onWidgetReady = () => {
		embedDonePromise.resolve()
	}

	const _getScoreDistribution = () => {
		ScoreSrv.getScoreDistribution(widgetInstance.id, (data) => {
			_sendToWidget('scoreDistribution', [data])
		})
	}

	const _sendToWidget = (type, args) => {
		return scoreWidget.contentWindow.postMessage(
			JSON.stringify({ type, data: args }),
			STATIC_CROSSDOMAIN
		)
	}

	const _sendWidgetInit = () => {
		if (qset == null || scoreWidget == null) {
			$scope.invalid = true
			return
		}
		$scope.show = true
		_sendToWidget('initWidget', [qset, scoreTable, widgetInstance, isPreview, MEDIA_URL])
	}

	const _sendWidgetUpdate = () => {
		_sendToWidget('updateWidget', [qset, scoreTable])
	}

	const _setHeight = (h) => {
		const min_h = widgetInstance.widget.height
		let desiredHeight = Math.max(h, min_h)
		scoreWidget.style.height = `${desiredHeight}px`
	}

	// expose on scope
	$scope.guestAccess = false
	$scope.classRankText = COMPARE_TEXT_OPEN
	$scope.isPreview = isPreview
	$scope.isEmbedded = isEmbedded
	$scope.toggleClassRankGraph = _toggleClassRankGraph
	$scope.showScoresOverview = true
	$scope.customScoreScreen = false
	$scope.showResultsTable = true
	$scope.prevMouseOver = () => ($scope.prevAttemptClass = 'open')
	$scope.prevMouseOut = () => ($scope.prevAttemptClass = '')
	$scope.prevClick = () => ($scope.prevAttemptClass = 'open')
	$scope.attemptClick = () => {
		if (isMobile.any()) {
			$scope.prevAttemptClass = ''
		}
	}

	// when the url has changes, reload the questions
	window.addEventListener('hashchange', () => {
		if (!hashAllowUpdate) {
			hashAllowUpdate = true
			return
		}
		_getScoreDetails().then(() => {
			if ($scope.customScoreScreen) {
				_sendWidgetUpdate()
			}
		})
	})

	// Initialize
	_displayScoreData(widget_id, play_id).then(() => {
		if ($scope.customScoreScreen) {
			embedDonePromise.promise.then(_sendWidgetInit)
		}
	})
})
