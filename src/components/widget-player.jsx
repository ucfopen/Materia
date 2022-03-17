import React, { useState, useEffect, useRef, useReducer } from 'react'
import { useQuery } from 'react-query'
import { apiGetWidgetInstance, apiGetQuestionSet } from '../util/api'
import { player } from './materia-constants'
import usePlayStorageDataSave from './hooks/usePlayStorageDataSave'
import usePlayLogSave from './hooks/usePlayLogSave'
import LoadingIcon from './loading-icon'
import './widget-player.scss'

const initAlert = () => ({
	msg: '',
	title: '',
	fatal: false
})

const initDemo = () => ({
	allowFullScreen: false,
	loading: true,
	htmlPath: null,
	height: '',
	width: 'auto'
})

const initLogs = () => ({ play: [], storage: [] })

const logReducer = (state, action) => {
	switch (action.type) {
		case 'addPlay':
				return {...state, play: [...state.play, action.payload.log]}
			case 'addStorage':
				return {...state, storage: [...state.storage, action.payload.log]}
			case 'clearPlay':
				return {...state, play: []}
			case 'clearStorage':
				return {...state, storage: []}

		default:
			throw new Error(`Unrecognized action: ${action.type}`);
	}
}

// converts current widget/instance structure to the one expected by the player
const _translateForApiVersion = (instance, qset) => {
	// switch based on version expected by the widget
	let output
	switch (parseInt(instance.widget.api_version)) {
		case 1:
			output = {
				startDate: instance.open_at,
				playable: instance.widget.is_playable,
				embedUrl: instance.embed_url,
				engineName: instance.widget.name,
				endDate: instance.close_at,
				GRID: instance.widget.id,
				type: instance.type,
				dateCreate: instance.created_at,
				version: '',
				playUrl: instance.play_url,
				QSET: qset,
				isDraft: instance.is_draft,
				height: instance.widget.height,
				dir: instance.group,
				storesData: instance.widget.is_storage_enabled,
				name: instance.name,
				engineID: instance.widget.id,
				GIID: instance.id,
				flVersion: instance.flash_version,
				isQSetEncrypted: instance.widget.is_qset_encrypted,
				cleanName: instance.widget.clean_name,
				attemptsAllowed: instance.attempts,
				recordsScores: instance.widget.is_scorable,
				width: instance.widget.width,
				isAnswersEncrypted: instance.widget.is_answer_encrypted,
				cleanOwner: '',
				editable: instance.widget.is_editable,
				previewUrl: instance.preview_url,
				userID: instance.user_id,
				scoreModule: instance.widget.score_module,
			}
			break
		case 2:
			output = instance
			output.qset = qset
			break
		default:
			output = instance
			output.qset = qset
	}
	return output
}

const isPreview = window.location.href.includes('/preview/') || window.location.href.includes('/preview-embed/')
const isEmbedded = window.location.href.includes('/embed/') || window.location.href.includes('/preview-embed/')

const WidgetPlayer = ({instanceId, playId, minHeight='', minWidth=''}) => {
	const [alertMsg, setAlertMsg] = useState(initAlert())
	const [demoData, setDemoData] = useState(initDemo())
	const [startTime, setStartTime] = useState(0)
	const [heartbeatInterval, setHeartbeatInterval] = useState(-1)
	const [scoreScreenPending, setScoreScreenPending] = useState(false)
	const [pendingLogs, dispatchPendingLogs] = useReducer(logReducer, initLogs())
	const [logPushInProgress, setLogPushInProgress] = useState(false)
	const [retryCount, setRetryCount] = useState(0)
	const [scoreScreenURL, setScoreScreenURL] = useState(null)
	const [showScoreScreen, setShowScoreScreen] = useState(null)
	const [endState, setEndState] = useState(null)
	const playSaved = useRef(true) // Guarantees logs are sent before finishing game
	const storageSaved = useRef(true) // Guarantees logs are sent before finishing game
	const showScoreRef = useRef(false)
	const centerRef = useRef(null)
	const frameRef = useRef(null)
	const saveStorage = usePlayStorageDataSave()
	const savePlayLog = usePlayLogSave()
	const { data: inst } = useQuery({
		queryKey: ['widget-inst', instanceId],
		queryFn: () => apiGetWidgetInstance(instanceId),
		enabled: instanceId !== null,
		staleTime: Infinity
	})
	const { data: qset } = useQuery({
		queryKey: ['qset', instanceId],
		queryFn: () => apiGetQuestionSet(instanceId, playId),
		staleTime: Infinity,
		placeholderData: null
	})

	// Adds warning event listener
	useEffect(() => {
		window.addEventListener('beforeunload', _beforeUnload)

		return () => {
			window.removeEventListener('beforeunload', _beforeUnload);
		}
	}, [inst, isPreview, endState])

	// Ensures the callback doesn't have stale state
	useEffect(() => {
		if (!demoData.loading) {
			// setup the postmessage listener
			window.addEventListener('message', _onPostMessage, false)

			// cleanup this listener
			return () => {
				window.removeEventListener('message', _onPostMessage, false);
			}
		}
	}, [
		demoData.loading,
		qset,
		inst,
		startTime,
		alertMsg,
		pendingLogs,
		heartbeatInterval,
		logPushInProgress,
		endState
	])

	// Starts the widget player once the instance and qset have loaded
	useEffect(() => {
		// _getWidgetInstance
		if (!!inst && !inst.hasOwnProperty('id')) {
			_onLoadFail('Unable to get widget info.')
		}
		else if (inst && qset) {
			const fullscreen = inst.widget.meta_data.features.find((f) => f.toLowerCase() === 'fullscreen')
			let enginePath

			// _startPlaySession
			if (!isPreview && playId === null) {
				_onLoadFail('Unable to start play session.')
				return
			}

			// Gets the engine path
			if (inst.widget.player.substring(0, 4) === 'http') {
				// allow player paths to be absolute urls
				enginePath = inst.widget.player
			} else {
				// link to the static widget
				enginePath = WIDGET_URL + inst.widget.dir + inst.widget.player
			}

			// Starts up the demo with the htmlPath
			setDemoData ({
				allowFullScreen: fullscreen != undefined,
				loading: false,
				htmlPath: enginePath + '?' + inst.widget.created_at,
				width: `${inst.widget.width}px`,
				height: `${inst.widget.height}px`
			})
		}
	}, [inst, qset])

	// Sets the hearbeat when not preview and given valid startTime
	useEffect(() => {
		if (!isPreview && startTime !== 0) {
			const interval = setInterval(_sendAllPendingLogs, player.LOG_INTERVAL)
			setHeartbeatInterval(interval) // if not in preview mode, set the interval to send logs
			return () => clearInterval(interval);
		}
	}, [startTime, isPreview, pendingLogs])

	// Checks the logs to see if the end state should be triggered
	useEffect(() => {
		if (endState === 'sent' || showScoreScreen === null) return

		for (const val of pendingLogs.play) {
			// End session log received
			if (val.type === 2 && val.is_end === true) {
				_sendAllPendingLogs(() => {
					// Sets state to sent so logs don't try to send twice
					setEndState('sent')
					// shows the score screen upon callback if requested any time betwen method call and now
					if (showScoreScreen || scoreScreenPending) {
						_showScoreScreen()
					}
				})
			}
		}
	}, [pendingLogs, showScoreScreen])

	// Switches to the score page when ready
	useEffect(() => {
		if (showScoreRef.current && endState === 'sent' && playSaved.current && storageSaved.current) {
			window.location.assign(scoreScreenURL)
		}
	}, [endState, showScoreRef, scoreScreenURL, playSaved.current, storageSaved.current])

	// Sends messages to the widget player
	const _sendToWidget = (type, args) => {
		return frameRef.current.contentWindow.postMessage(
			JSON.stringify({ type, data: args }),
			STATIC_CROSSDOMAIN
		)
	}

	// Receives messages from widget player
	const _onPostMessage = e => {
		// build a link element to deconstruct the static url
		// this helps us match the static url against the event origin
		const a = document.createElement('a')
		a.href = STATIC_CROSSDOMAIN
		const expectedOrigin = a.href.substring(0, a.href.length - 1)

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
		}
		// TODO : make this an else?
		else if( ! ['react-devtools-content-script', 'react-devtools-bridge', 'react-devtools-inject-backend'].includes(e.data.source)) {
			throw new Error(
				`Post message Origin does not match. Expected: ${expectedOrigin}, Actual: ${e.origin}`
			)
		}
	}

	// Tests if the widget failed to load
	const _onWidgetReady = () => {
		switch (false) {
			case !(qset == null):
				_onLoadFail('Unable to load widget data.')
				break
			case !(frameRef.current == null):
				_onLoadFail('Unable to load widget.')
				break
			default:
				_sendWidgetInit()
		}
	}

	const _sendWidgetInit = () => {
		const convertedInstance = _translateForApiVersion(inst, qset)
		setStartTime(new Date().getTime())
		_sendToWidget('initWidget',	[qset, convertedInstance, BASE_URL, MEDIA_URL])
	}

	// Used to add play logs
	const _addLog = log => {
		playSaved.current = false
		log['game_time'] = (new Date().getTime() - startTime) / 1000 // log time in seconds
		dispatchPendingLogs({type: 'addPlay', payload: {log: log}})
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
					setScoreScreenPending(true)
				}
				break
			default:
				setEndState('pending')
				// kill the heartbeat
				if (heartbeatInterval !== -1) {
					clearInterval(heartbeatInterval)
					setHeartbeatInterval(-1)
				}
				// required to end a play
				_addLog({ type: 2, item_id: 0, text: '', value: null, is_end: true })
		}
		setShowScoreScreen(showScoreScreenAfter)
	}

	const _showScoreScreen = () => {
		let _scoreScreenURL = scoreScreenURL
		if (!scoreScreenURL) {
			if (isPreview) {
				_scoreScreenURL = `${BASE_URL}scores/preview/${instanceId}`
				setScoreScreenURL(_scoreScreenURL)
			} else if (isEmbedded) {
				_scoreScreenURL = `${BASE_URL}scores/embed/${instanceId}#play-${playId}`
				setScoreScreenURL(_scoreScreenURL)
			} else {
				_scoreScreenURL = `${BASE_URL}scores/${instanceId}#play-${playId}`
				setScoreScreenURL(_scoreScreenURL)
			}
		}

		if (!alertMsg.fatal) {
			showScoreRef.current = true
		}
	}

	const _sendStorage = msg => {
		if (!isPreview) {
			storageSaved.current = false
			dispatchPendingLogs({type: 'addStorage', payload: {log: msg}})
		}
	}

	const _sendAllPendingLogs = callback => {
		if (callback == null) {
			callback = () => {}
		}

		Promise.resolve(undefined)
			.then(_sendPendingStorageLogs())
			.then(_sendPendingPlayLogs)
			.then(callback)
			.catch(() => {
				_alert('There was a problem saving.', 'Something went wrong...', false)
			})
	}

	const _sendPendingStorageLogs = () => {
		if (!isPreview && pendingLogs.storage.length > 0) {
			saveStorage.mutate({
				play_id: playId,
				logs: pendingLogs.storage,
				successFunc: () => {
					dispatchPendingLogs({type: 'clearStorage'})
					storageSaved.current = true
				}
			})
		}
	}

	const _sendPendingPlayLogs = () => {
		if (pendingLogs.play.length > 0) {
			const args = [playId, pendingLogs.play]
			if (isPreview) {
				args.push(inst.id)
			}
			const newQueue = [{ request: args }] //[...pendingQueue, {, request: args, promise: deferred }]
			_pushPendingLogs(newQueue)
			dispatchPendingLogs({type: 'clearPlay'})
		}
	}

	const _pushPendingLogs = logQueue => {
		if (logPushInProgress) {
			return
		}

		// This shouldn't happen, but its a sanity check anyhow
		if (logQueue.length === 0) {
			setLogPushInProgress(false)
			return
		}
		else setLogPushInProgress(true)

		savePlayLog.mutate({
			request: logQueue[0].request,
			successFunc: (result) => {
				setRetryCount(0) // reset on success
				if (alertMsg.fatal) {
					setAlertMsg({...alertMsg, fatal: false})
				}

				if (result) {
					logQueue.shift()
					if (result.score_url) {
						// score_url is sent from server to redirect to a specific url
						setScoreScreenURL(result.score_url)
					} else if (result.type === 'error') {
						let title = 'Something went wrong...'
						let msg = result.msg
						if (!msg) {
							msg = 'Your play session is no longer valid! ' +
							'This may be due to logging out, your session expiring, or trying to access another Materia account simultaneously. ' +
							"You'll need to reload the page to start over."
						}

						_alert(msg, title, true)
					}
				}

				setLogPushInProgress(false)

				if (logQueue.length > 0) {
					_pushPendingLogs(logQueue)
				}
				else {
					playSaved.current = true
				}
			},
			failureFunc: () => {
				setRetryCount((oldCount) => {
					let retrySpeed = player.RETRY_FAST

					if (oldCount > player.RETRY_LIMIT) {
						retrySpeed = player.RETRY_SLOW

						// TODO shouldn't this be false for fatal?
						_alert(
							"Connection to Materia's server was lost. Check your connection or reload to start over.",
							'Something went wrong...',
							true
						)
					}
					// console.log(`retrying in ${retrySpeed/1000} second(s)`)

					setTimeout(() => {
						setLogPushInProgress(false)
						_pushPendingLogs(logQueue)
					}, retrySpeed)

					return oldCount+1
				})
			}
		})
	}

	const _alert = (msg, title = 'Warning!', fatal = false) => {
		setAlertMsg({
			msg: msg,
			title: title,
			fatal: fatal
		})

		alert(`${title} : ${msg} : is${!fatal ? ' not' : ''} fatal`)
	}

	const _setHeight = h => {
		const min_h = inst.widget.height
		let desiredHeight = Math.max(h, min_h)
		setDemoData((oldData) => ({...oldData, height: `${desiredHeight}px`}))
	}

	const _setVerticalScroll = location => {
		const containerElement = frameRef.current
		const calculatedLocation = window.scrollY + containerElement.getBoundingClientRect().y + location
		window.scrollTo(0, calculatedLocation)
	}

	const _onLoadFail = msg => _alert(msg, 'Failure!', true)

	const _beforeUnload = e => {
		if (inst.widget.is_scorable === '1' && !isPreview && endState !== 'sent') {
			const confirmationMsg = 'Wait! Leaving now will forfeit this attempt. To save your score you must complete the widget.'
			e.returnValue = confirmationMsg
			e.preventDefault()
			return confirmationMsg
		} else {
			return undefined
		}
	}

	let previewBarRender = null
	if (isPreview) {
		previewBarRender = (
			<header className='preview-bar'
				style={{width: demoData.width !== '0px' ? demoData.width : ''}}>
			</header>
		)
	}

	let loadingRender = null
	if (demoData.loading) {
		loadingRender = (
			<LoadingIcon size='lrg'
				position='absolute'
				top={`0px`}
				left={`0px`}
			/>
		)
	}

	return (
		<section className={`widget ${isPreview ? 'preview' : ''}`}
			style={{display: demoData.loading ? 'none' : 'block'}}>
			{ previewBarRender }
			<div className='center'
				ref={centerRef}
				style={{minHeight: minHeight + 'px',
					minWidth: minWidth + 'px',
					width: demoData.width !== '0px' ? demoData.width : 'auto',
					height: demoData.height !== '0px' ? demoData.height : '',
					position: demoData.loading ? 'relative' : 'static'}}>
				<iframe src={ demoData.htmlPath }
					id='container'
					className='html'
					scrolling='yes'
					ref={frameRef}
				/>
				{ loadingRender }
			</div>
		</section>
	)
}

export default WidgetPlayer
