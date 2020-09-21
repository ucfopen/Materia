const app = angular.module('materia')
app.controller('WidgetPlayerCtrl', function (
	Please,
	$scope,
	$location,
	$q,
	$interval,
	$window,
	$timeout,
	WidgetSrv,
	UserServ,
	PLAYER,
	Alert
) {
	// Keep track of a promise
	let embedDonePromise = null
	// Widget instance
	let instance = null
	// Logs that have yet to be synced
	const pendingLogs = { play: [], storage: [] }

	let expectedOrigin = null
	// ID of the current play, received from embedded inline script variables
	let play_id = null
	// hold onto the qset from the instance
	let qset = null
	// the time the widget starts playing
	let startTime = 0
	// widget container object, used for postMessage
	let widget = null
	// .swf or .html
	let widgetType = null
	// Keeps the state of whether scores have been sent yet when receiving .end() calls from widgets
	let endState = null
	// Whether or not to show the score screen as soon as playlogs get synced
	let scoreScreenPending = false
	// Keep track of the timer id for the heartbeat so we can clear the timeout
	let heartbeatInterval = -1
	// Calculates which screen UserServ to show (preview, embed, or normal)
	let scoreScreenURL = null
	// Queue of requests
	const pendingQueue = []
	// Whether or not a queue push is in progress
	let logPushInProgress = false
	// number of times the logs an retried sending
	let retryCount = 0
	// dom element where the widget is embedded
	let embedTargetEl

	const _alert = (msg, title = 'Warning!', fatal = false) => {
		$scope.alert.msg = msg
		$scope.alert.title = title
		$scope.alert.fatal = fatal
		Please.$apply()
	}

	const _sendAllPendingLogs = (callback) => {
		if (callback == null) {
			callback = () => {}
		}

		$q((resolve) => resolve())
			.then(_sendPendingStorageLogs())
			.then(_sendPendingPlayLogs)
			.then(callback)
			.catch(() => {
				_alert('There was a problem saving.', 'Something went wrong...', false)
			})
	}

	const _onWidgetReady = () => {
		widget = embedTargetEl
		switch (false) {
			case !(qset == null):
				embedDonePromise.reject('Unable to load widget data.')
			case !(widget == null):
				embedDonePromise.reject('Unable to load widget.')
			default:
				embedDonePromise.resolve()
		}
	}

	const _addLog = (log) => {
		// add to pending logs
		log['game_time'] = (new Date().getTime() - startTime) / 1000 // log time in seconds
		pendingLogs.play.push(log)
	}

	const _sendStorage = (log) => {
		if (!$scope.isPreview) {
			pendingLogs.storage.push(log)
		}
	}

	const _end = (showScoreScreenAfter = true) => {
		switch (endState) {
			case 'sent':
				if (showScoreScreenAfter) {
					_showScoreScreen()
				}
				break
			case 'pending':
				if (showScoreScreenAfter) {
					scoreScreenPending = true
				}
				break
			default:
				endState = 'pending'
				// kill the heartbeat
				if (heartbeatInterval !== -1) {
					$interval.cancel(heartbeatInterval)
					heartbeatInterval = -1
				}
				// required to end a play
				_addLog({ type: 2, item_id: 0, text: '', value: null })
				// send anything remaining
				_sendAllPendingLogs(() => {
					// Async callback after final logs are sent
					endState = 'sent'
					// shows the score screen upon callback if requested any time betwen method call and now
					if (showScoreScreenAfter || scoreScreenPending) {
						_showScoreScreen()
					}
				})
		}
	}

	const _startHeartBeat = () => {
		const deferred = $q.defer()
		$interval(() => {
			Materia.Coms.Json.send('session_play_verify', [play_id]).then((result) => {
				if (result !== true && instance.guest_access === false) {
					_alert(
						"Your play session is no longer valid.  You'll need to reload the page and start over.",
						'Invalid Play Session',
						true
					)
				}
			})
		}, 30000)

		deferred.resolve()
		return deferred.promise
	}

	const _sendWidgetInit = () => {
		const deferred = $q.defer()
		const convertedInstance = _translateForApiVersion(instance)
		startTime = new Date().getTime()
		_sendToWidget(
			'initWidget',
			widgetType === '.swf'
				? [qset, convertedInstance]
				: [qset, convertedInstance, BASE_URL, MEDIA_URL]
		)
		if (!$scope.isPreview) {
			heartbeatInterval = $interval(_sendAllPendingLogs, PLAYER.LOG_INTERVAL) // if not in preview mode, set the interval to send logs
		}

		deferred.resolve()
		return deferred.promise
	}

	const _sendToWidget = (type, args) => {
		switch (widgetType) {
			case '.swf':
				return widget[type].apply(widget, args)
			case '.html':
				return widget.contentWindow.postMessage(
					JSON.stringify({ type, data: args }),
					STATIC_CROSSDOMAIN
				)
		}
	}

	const _onLoadFail = (msg) => _alert(`Failure: ${msg}`, null, true)

	const _embed = () => {
		embedDonePromise = $q.defer()
		let enginePath

		widgetType = instance.widget.player.slice(instance.widget.player.lastIndexOf('.'))

		if (instance.widget.player.substring(0, 4) === 'http') {
			// allow player paths to be absolute urls
			enginePath = instance.widget.player
		} else {
			// link to the static widget
			enginePath = WIDGET_URL + instance.widget.dir + instance.widget.player
		}

		if ($scope.isPreview && instance.widget.width > 0) {
			let previewBarEl = document.getElementsByClassName('preview-bar')[0]
			previewBarEl.style.width = `${instance.widget.width}px`
		}

		$timeout(() => {
			switch (widgetType) {
				case '.swf':
					_embedFlash(enginePath, '10')
					break
				case '.html':
					_embedHTML(enginePath)
					break
			}
		})

		return embedDonePromise.promise
	}

	const _embedFlash = (enginePath, version) => {
		// register global callbacks for ExternalInterface calls
		$window.__materia_sendStorage = _sendStorage
		$window.__materia_onWidgetReady = _onWidgetReady
		$window.__materia_sendPendingLogs = _sendAllPendingLogs
		$window.__materia_end = _end
		$window.__materia_addLog = _addLog
		const express = `${STATIC_CROSSDOMAIN}js/vendor/swfobject/expressInstall.swf`
		let width = '100%'
		let height = '100%'
		const flashvars = {
			inst_id: $scope.inst_id,
			GIID: $scope.inst_id,
			URL_WEB: BASE_URL,
			URL_GET_ASSET: 'media/',
		}
		const params = {
			menu: 'false',
			allowFullScreen: 'true',
			AllowScriptAccess: 'always',
		}
		const attributes = {
			id: PLAYER.EMBED_TARGET,
		}

		$scope.type = 'flash'
		Please.$apply()

		swfobject.embedSWF(
			enginePath,
			PLAYER.EMBED_TARGET,
			width,
			height,
			String(version),
			express,
			flashvars,
			params,
			attributes
		)
		embedTargetEl = document.getElementById(PLAYER.EMBED_TARGET)
	}

	const _onPostMessage = (e) => {
		if (e.origin === expectedOrigin) {
			const msg = JSON.parse(e.data)
			switch (msg.type) {
				case 'start':
					return _onWidgetReady()
				case 'addLog':
					return _addLog(msg.data)
				case 'end':
					return _end(msg.data)
				case 'sendStorage':
					return _sendStorage(msg.data)
				case 'sendPendingLogs':
					return _sendAllPendingLogs()
				case 'alert':
					return _alert(msg.data.msg, msg.data.title, msg.fatal)
				case 'setHeight':
					return _setHeight(msg.data[0])
				case 'setVerticalScroll':
					return _setVerticalScroll(msg.data[0])
				case 'initialize':
					break
				default:
					throw new Error(`Unknown PostMessage received from player core: ${msg.type}`)
			}
		} else {
			throw new Error(
				`Post message Origin does not match. Expected: ${expectedOrigin}, Actual: ${e.origin}`
			)
		}
	}

	const _embedHTML = (enginePath) => {
		$scope.type = 'html'
		$scope.htmlPath = enginePath + '?' + instance.widget.created_at
		Please.$apply()
		embedTargetEl = document.getElementById(PLAYER.EMBED_TARGET)
		// if (instance.widget.width > 0) {
		// 	embedTargetEl.style.width = `${instance.widget.width}px`
		// }
		// if (instance.widget.height > 0) {
		// 	embedTargetEl.style.width = `${instance.widget.height}px`
		// }

		// build a link element to deconstruct the static url
		// this helps us match static url against the event origin
		const a = document.createElement('a')
		a.href = STATIC_CROSSDOMAIN
		expectedOrigin = a.href.substr(0, a.href.length - 1)

		// setup the postmessage listener
		window.addEventListener('message', _onPostMessage, false)
		Please.$apply()
	}

	const _getWidgetInstance = () => {
		const deferred = $q.defer()

		if ($scope.type === 'noflash') {
			deferred.reject('Flash Player required.')
		}

		WidgetSrv.getWidget($scope.inst_id).then((inst) => {
			if (!inst.hasOwnProperty('id')) {
				return deferred.reject('Unable to get widget info.')
			}
			instance = inst
			const type = instance.widget.player.split('.').pop()
			const version = parseInt(instance.widget.flash_version, 10)

			// Fullscreen flag set as an optional parameter in widget install.yaml; have to dig into instance widget's meta_data object to find it
			// can't use array.includes() since it's necessary to ensure comparison is case insensitive
			let fullscreen = inst.widget.meta_data.features.find((f) => f.toLowerCase() === 'fullscreen')
			$scope.allowFullScreen = fullscreen != undefined

			if (type === 'swf' && swfobject.hasFlashPlayerVersion(String(version)) === false) {
				$scope.type = 'noflash'
				deferred.reject('Newer Flash Player version required.')
			} else {
				let el = document.getElementsByClassName('center')[0]

				if (instance.widget.width > 0) {
					// @TODO, just use scope
					el.style.width = `${instance.widget.width}px`
				}
				if (instance.widget.height > 0) {
					el.style.height = `${instance.widget.height}px`
				}
				deferred.resolve()
			}
			let widgetEl = document.getElementsByClassName('widget')[1]
			widgetEl.style.display = 'block'
		})

		Please.$apply()

		return deferred.promise
	}

	const _startPlaySession = () => {
		const deferred = $q.defer()

		if ($scope.type === 'noflash') {
			deferred.reject('Flash Player Required.')
		} else if ($scope.isPreview) {
			deferred.resolve()
		} else {
			// get the play id from the embedded variable on the page:
			play_id = PLAY_ID

			if (play_id != null) {
				deferred.resolve()
			} else {
				deferred.reject('Unable to start play session.')
			}
		}

		return deferred.promise
	}

	const _getQuestionSet = () => {
		// TODO: if bad qSet : deferred.reject('Unable to load questions.')
		return Materia.Coms.Json.send('question_set_get', [$scope.inst_id, play_id]).then((result) => {
			qset = result
		})
	}

	const _pushPendingLogs = () => {
		if (logPushInProgress) {
			return
		}
		logPushInProgress = true

		// This shouldn't happen, but its a sanity check anyhow
		if (pendingQueue.length === 0) {
			logPushInProgress = false
			return
		}

		return Materia.Coms.Json.send('play_logs_save', pendingQueue[0].request)
			.then((result) => {
				retryCount = 0 // reset on success
				if ($scope.alert.fatal) {
					$scope.alert.fatal = false
				}

				if (result) {
					if (result.score_url) {
						// score_url is sent from server to redirect to a specific url
						scoreScreenURL = result.score_url
					} else if (result.type === 'error') {
						let title = 'Something went wrong...'
						let msg = result.msg
						if (!msg) {
							msg =
								"Your play session is no longer valid! This may be due to logging out, your session expiring, or trying to access another Materia account simultaneously. You'll need to reload the page to start over."
						}

						_alert(msg, title, true)
					}
				}

				const previous = pendingQueue.shift()
				previous.promise.resolve()

				logPushInProgress = false

				if (pendingQueue.length > 0) {
					_pushPendingLogs()
				}
			})
			.catch(() => {
				retryCount++
				let retrySpeed = PLAYER.RETRY_FAST

				if (retryCount > PLAYER.RETRY_LIMIT) {
					retrySpeed = PLAYER.RETRY_SLOW
					_alert(
						"Connection to Materia's server was lost. Check your connection or reload to start over.",
						'Something went wrong...',
						true
					)
				}

				$timeout(() => {
					logPushInProgress = false
					_pushPendingLogs()
				}, retrySpeed)
			})
	}

	const _sendPendingPlayLogs = () => {
		const deferred = $q.defer()

		if (pendingLogs.play.length > 0) {
			const args = [play_id, pendingLogs.play]
			if ($scope.isPreview) {
				args.push($scope.inst_id)
			}
			pendingQueue.push({ request: args, promise: deferred })
			_pushPendingLogs()

			pendingLogs.play = []
		} else {
			deferred.resolve()
		}

		return deferred.promise
	}

	const _sendPendingStorageLogs = () => {
		const deferred = $q.defer()

		if (!$scope.isPreview && pendingLogs.storage.length > 0) {
			Materia.Coms.Json.send('play_storage_data_save', [play_id, pendingLogs.storage]).then(() => {
				deferred.resolve()
				pendingLogs.storage = []
			})
		} else {
			deferred.resolve()
		}

		return deferred.promise
	}

	// converts current widget/instance structure to the one expected by the player
	const _translateForApiVersion = (inst) => {
		// switch based on version expected by the widget
		let output
		switch (parseInt(inst.widget.api_version)) {
			case 1:
				output = {
					startDate: inst.open_at,
					playable: inst.widget.is_playable,
					embedUrl: inst.embed_url,
					engineName: inst.widget.name,
					endDate: inst.close_at,
					GRID: inst.widget.id,
					type: inst.widget.type,
					dateCreate: inst.created_at,
					version: '',
					playUrl: inst.play_url,
					QSET: inst.qset,
					isDraft: inst.is_draft,
					height: inst.widget.height,
					dir: inst.group,
					storesData: inst.widget.is_storage_enabled,
					name: inst.name,
					engineID: inst.widget.id,
					GIID: inst.id,
					flVersion: inst.flash_version,
					isQSetEncrypted: inst.widget.is_qset_encrypted,
					cleanName: inst.widget.clean_name,
					attemptsAllowed: inst.attempts,
					recordsScores: inst.widget.is_scorable,
					width: inst.widget.width,
					isAnswersEncrypted: inst.widget.is_answer_encrypted,
					cleanOwner: '',
					editable: inst.widget.is_editable,
					previewUrl: inst.preview_url,
					userID: inst.user_id,
					scoreModule: inst.widget.score_module,
				}
				break
			case 2:
				output = inst
				break
			default:
				output = inst
		}
		return output
	}

	const _setHeight = (h) => {
		const min_h = instance.widget.height
		let el = document.getElementsByClassName('center')[0]
		let desiredHeight = Math.max(h, min_h)
		el.style.height = `${desiredHeight}px`
	}

	const _setVerticalScroll = (location) => {
		const containerElement = document.getElementById('container')
		const calculatedLocation =
			window.scrollY + containerElement.getBoundingClientRect().y + location

		window.scrollTo(0, calculatedLocation)
	}

	const _showScoreScreen = () => {
		if (!scoreScreenURL) {
			if ($scope.isPreview) {
				scoreScreenURL = `${BASE_URL}scores/preview/${$scope.inst_id}`
			} else if ($scope.isEmbedded) {
				scoreScreenURL = `${BASE_URL}scores/embed/${$scope.inst_id}#play-${play_id}`
			} else {
				scoreScreenURL = `${BASE_URL}scores/${$scope.inst_id}#play-${play_id}`
			}
		}

		if (!$scope.alert.fatal) {
			window.location.assign(scoreScreenURL)
		}
	}

	const _beforeUnload = (e) => {
		if (instance.widget.is_scorable === '1' && !$scope.isPreview && endState !== 'sent') {
			return 'Wait! Leaving now will forfeit this attempt. To save your score you must complete the widget.'
		} else {
			return undefined
		}
	}

	// expose on scope

	$scope.alert = Alert
	$scope.type = null // flash, html, no-flash
	// src path for the engine to load
	$scope.htmlPath = null
	// Controls whether or not the widget iframe will allow fullscreen behavior (disabled by default)
	$scope.allowFullScreen = false
	// Controls whether the view has a "preview" header bar
	// search for preview or embed directory in the url
	$scope.isPreview = String($location.absUrl()).includes('preview')
	// Whether or not to show the embed view
	$scope.isEmbedded = top !== self

	$window.onbeforeunload = _beforeUnload

	$timeout(() => {
		$q.all([_getWidgetInstance(), _startPlaySession()])
			.then(_getQuestionSet)
			.then(_embed)
			.then(_sendWidgetInit)
			.then(_startHeartBeat)
			.catch(_onLoadFail)
	})

	/* develblock:start */
	// these method are exposed for testing
	$scope.jestTest = {
		_alert,
		_sendAllPendingLogs,
		_onWidgetReady,
		_addLog,
		_sendStorage,
		_end,
		_startHeartBeat,
		_sendWidgetInit,
		_sendToWidget,
		_onLoadFail,
		_embed,
		_embedFlash,
		_embedHTML,
		_getWidgetInstance,
		_startPlaySession,
		_getQuestionSet,
		_pushPendingLogs,
		_sendPendingPlayLogs,
		_sendPendingStorageLogs,
		_translateForApiVersion,
		_setHeight,
		_showScoreScreen,
		getLocalVar: (name) => eval(name),
		/* istanbul ignore next */
		setLocalVar: (name, value) => {
			/* istanbul ignore next */
			let x = eval(name)
			/* istanbul ignore next */
			x = value
		},
		setEmbedTargetEl: (el) => {
			embedTargetEl = el
		},
		setQset: (obj) => {
			qset = obj
		},
		getEmbedDonePromise: () => embedDonePromise,
		setEndState: (state) => {
			endState = state
		},
	}
	/* develblock:end */
})
