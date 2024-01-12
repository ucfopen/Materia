import React, { useState, useEffect, useRef, useReducer } from 'react'
import { useQuery } from 'react-query'
import { v4 as uuidv4 } from 'uuid';
import { apiGetWidgetInstance, apiGetQuestionSet, apiSessionVerify } from '../util/api'
import { player } from './materia-constants'
import Alert from './alert'
import usePlayStorageDataSave from './hooks/usePlayStorageDataSave'
import usePlayLogSave from './hooks/usePlayLogSave'
import LoadingIcon from './loading-icon'
import './widget-player.scss'

const HEARTBEAT_INTERVAL = 15000 // 15 seconds for each heartbeat

const initLogs = () => ({ play: [], storage: [] })

// Ensure the pending log queue is immutable by running each state update through the reducer
// addPlay appends logs to the play log queue, shiftPlay removes logs from the queue based on the ids passed in action.payload.ids
// storage logs are simpler, once the mutation is run the callback function calls clearStorage to empty the box
const logReducer = (state, action) => {
	switch (action.type) {
		case 'addPlay':
			return {...state, play: [...state.play, action.payload.log]}
		case 'shiftPlay':
			return {...state, play: [...state.play].filter((play) => !action.payload.ids.includes(play.queueId))}
		case 'addStorage':
			return {...state, storage: [...state.storage, action.payload.log]}
		case 'shiftStorage':
			return {...state, storage: [...state.storage].filter((storage) => !action.payload.ids.includes(storage.queueId))}

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
const isEmbedded = window.location.href.includes('/embed/') || window.location.href.includes('/preview-embed/') || window.location.href.includes('/lti/assignment')

const WidgetPlayer = ({instanceId, playId, minHeight='', minWidth='',showFooter=true}) => {

	const [alert, setAlert] = useState({
		msg: '',
		title: '',
		fatal: false
	})
	const [attributes, setAttributes] = useState({
		allowFullScreen: false,
		loading: true,
		htmlPath: null,
		height: '',
		width: 'auto',
	})
	const [startTime, setStartTime] = useState(0)
	const [heartbeatActive, setHeartbeatActive] = useState(false)
	const [pendingLogs, dispatchPendingLogs] = useReducer(logReducer, initLogs())
	const [playState, setPlayState] = useState('init')

	const [readyForScoreScreen, setReadyForScoreScreen] = useState(false)
	const [retryCount, setRetryCount] = useState(0) // retryCount's value is referenced within the function passed to setRetryCount
	const [queueProcessing, setQueueProcessing] = useState(false)

	const savePlayLog = usePlayLogSave()
	const saveStorage = usePlayStorageDataSave()
	

	// refs are used instead of state when value updates do not require a component rerender
	const centerRef = useRef(null)
	const frameRef = useRef(null)
	const scoreScreenUrlRef = useRef(null)

	/*********************** queries ***********************/

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

	const { data: heartbeat } = useQuery({
		queryKey: ['heartbeat', playId],
		queryFn: () => apiSessionVerify(playId),
		staleTime: Infinity,
		refetchInterval: HEARTBEAT_INTERVAL,
		enabled: !!playId && heartbeatActive,
		onSettled: (result) => {
			if (result != true) {
				setAlert({
					msg: "Your play session is no longer valid.  You'll need to reload the page and start over.",
					title: 'Invalid Play Session',
					fatal: true
				})
			}
		}
	})

	/*********************** listeners ***********************/
	/* note: the values being tracked by these hooks is so the state values referenced in the callbacks is up-to-date */

	// Adds warning event listener
	useEffect(() => {
		if (inst && !isPreview && playState == 'playing') {
			window.addEventListener('beforeunload', _beforeUnload)

			return () => {
				window.removeEventListener('beforeunload', _beforeUnload)
			}
		}
	}, [inst, isPreview, playState])

	// Ensures the postMessage callback doesn't have stale state
	useEffect(() => {
		if (!attributes.loading) {
			// setup the postmessage listener
			window.addEventListener('message', _onPostMessage, false)

			// cleanup this listener
			return () => {
				window.removeEventListener('message', _onPostMessage, false)
			}
		}
	}, [attributes, alert, playState, pendingLogs])

	/*********************** hooks ***********************/

	// Starts the widget player once the instance and qset have loaded
	useEffect(() => {
		if (!!inst && !inst.hasOwnProperty('id')) {
			_onLoadFail('Unable to get widget info.')
		}
		else if (inst && qset) {
			const fullscreen = inst.widget.meta_data.features.find((f) => f.toLowerCase() === 'fullscreen')
			let enginePath

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
				enginePath = window.WIDGET_URL + inst.widget.dir + inst.widget.player
			}

			// Starts up the demo with the htmlPath
			setAttributes ({
				allowFullScreen: fullscreen != undefined,
				loading: false,
				htmlPath: enginePath + '?' + inst.widget.created_at,
				width: `${inst.widget.width}px`,
				height: `${inst.widget.height}px`
			})

			scoreScreenUrlRef.current = _initScoreScreenUrl()
		}
	}, [inst, qset])

	// initializes heartbeat
	useEffect(() => {
		if (startTime !== 0 && !isPreview && !!inst && !inst.guest_access && !heartbeatActive) setHeartbeatActive(true)
	},[startTime, inst, isPreview])

	// was a fatal alert triggered? Turn off the heartbeat, the play is abandoned
	useEffect(() => {
		if (!!alert.msg && !!alert.title && alert.fatal) {
			setHeartbeatActive(false)
		}
	},[alert])


	// hook associated with log queue management
	useEffect(() => {

		// widget has initialized and we're listening for logs
		if ((playState == 'playing' || playState == 'pending') && !queueProcessing) {

			// PLAY logs
			if (pendingLogs.play && pendingLogs.play.length > 0) {
				const args = [playId, pendingLogs.play]
				if (isPreview) {
					args.push(inst.id)
				}
				_pushPendingLogs([{ request: args }])
			}

			// STORAGE logs
			if (!isPreview && pendingLogs.storage && pendingLogs.storage.length > 0) {
				const args = [playId, pendingLogs.storage]
				_pushPendingStorageLogs([{ request: args }])
			}
		}

		// log queues are empty, we're no longer processing, playState can be updated to 'end' to indicate the widget has wrapped up
		if (playState == 'pending' && pendingLogs.play?.length == 0 && pendingLogs.storage?.length == 0 && !queueProcessing) {
			setPlayState('end')
		}

	}, [pendingLogs, queueProcessing, playState, readyForScoreScreen])

	/******* !!!!!! this is the hook that actually navigates to the score screen !!!!! *******/
	useEffect(() => {
		if (playState == 'end' && readyForScoreScreen && scoreScreenUrlRef.current) {
			window.location.assign(scoreScreenUrlRef.current)
		}
	}, [playState, readyForScoreScreen])

	/*********************** player communication ***********************/

	// Sends messages to the widget player
	const _sendToWidget = (type, args) => {
		return frameRef.current.contentWindow.postMessage(
			JSON.stringify({ type, data: args }),
			window.STATIC_CROSSDOMAIN
		)
	}

	// Receives messages from widget player
	const _onPostMessage = e => {
		const origin = `${e.origin}/`
		if (origin === window.STATIC_CROSSDOMAIN || origin === window.BASE_URL) {
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
					return setAlert({
						msg: msg.data.msg || 'Something went wrong',
						title: msg.data.title || 'We encountered a problem',
						fatal: msg.fatal || false
					})
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
		else if( ! ['react-devtools-content-script', 'react-devtools-bridge', 'react-devtools-inject-backend'].includes(e.data.source)) {
			throw new Error(
				`Post message Origin does not match. Expected: ${expectedOrigin}, Actual: ${origin}`
			)
		}
	}

	const _onWidgetReady = () => {
		if (!frameRef.current) {
			_onLoadFail('Unable to load widget.')
		} else {
			const convertedInstance = _translateForApiVersion(inst, qset)
			setStartTime(new Date().getTime())
			_sendToWidget('initWidget',	[qset, convertedInstance, window.BASE_URL, window.MEDIA_URL])
			setPlayState('playing')
		}
	}

	const _end = (showScoreScreenAfter = true) => {
		switch (playState) {
			case 'init':
			case 'playing':
				// kill the heartbeat
				if (heartbeatActive) {
					setHeartbeatActive(false)
				}
				// required to end a play
				_addLog({ type: 2, item_id: 0, text: '', value: null, is_end: true })

				// pending indicates we should process all remaining logs
				setPlayState('pending')

				// readyForScoreScreen, in combination with playState == end, will determine advancement to the score screen
				if (showScoreScreenAfter) setReadyForScoreScreen(true)
				break

			case 'pending':
			case 'end':
				if (showScoreScreenAfter) setReadyForScoreScreen(true)
		}
	}

	/*********************** logging ***********************/

	// Used to add play logs
	const _addLog = log => {
		const d = new Date().getTime()
		log['game_time'] = (d - startTime) / 1000 // log time in seconds
		log['queueId'] = uuidv4() // this isn't actually used by the server, instead it's a way to identify which logs have been processed. Using a uuid to prevent collisions
		dispatchPendingLogs({type: 'addPlay', payload: {log: log}})
	}

	const _pushPendingLogs = logQueue => {
		setQueueProcessing(true)

		// create an array of the queue ids we can pass to the reducer to remove those logs from the pendingLogs state object
		let qIds = logQueue[0].request[1]?.map((log) => {
			return log.queueId
		})

		savePlayLog.mutate({
			request: logQueue[0].request,
			successFunc: (result) => {

				setRetryCount(0) // reset on success

				if (result) {
					// this removes all the currently queued logs from the pendingLogs state object, by way of the reducer
					// leverages React's built-in state management to prevent race conditions with log processing
					// when a function is passed to useState, the results of the function are passed to each subsequent call of useState
					// this way, the pendingLogs state object remains immutable and the alterations should be queued correctly
					dispatchPendingLogs({type: 'shiftPlay', payload: { ids: [...qIds]}})
					logQueue.shift()

					// score_url is sent from the server to redirect to a specific url
					if (result.score_url) {
						scoreScreenUrlRef.current = result.score_url
					} else if (result.type === 'error') {

						setAlert({
							title: 'We encountered a problem',
							msg: result.msg || 'An error occurred when saving play logs',
							fatal: true
						})
					}
				}

				if (logQueue.length > 0) _pushPendingLogs(logQueue)
				else setQueueProcessing(false)
			},
			failureFunc: () => {
				setRetryCount((oldCount) => {
					let retrySpeed = player.RETRY_FAST

					if (oldCount > player.RETRY_LIMIT) {
						retrySpeed = player.RETRY_SLOW

						setAlert({
							title: 'We encountered a problem',
							msg: 'Connection to the Materia server was lost. Check your connection or reload to start over.',
							fatal: false
						})
					}

					setTimeout(() => {
						_pushPendingLogs(logQueue)
					}, retrySpeed)

					return oldCount+1
				})
			}
		})
	}

	const _pushPendingStorageLogs = logQueue => {
		setQueueProcessing(true)

		// create an array of the queue ids we can pass to the reducer to remove those logs from the pendingLogs state object
		let qIds = logQueue[0].request[1]?.map((log) => {
			return log.queueId
		})

		saveStorage.mutate({
			play_id: logQueue[0].request[0],
			logs: logQueue[0].request[1],
			successFunc: (result) => {
				if (result) {
					dispatchPendingLogs({type: 'shiftStorage', payload: { ids: [...qIds]}})
					logQueue.shift()

					if (logQueue.length > 0) _pushPendingStorageLogs(logQueue)
					else setQueueProcessing(false)

				} else {
					setAlert({
						msg: 'There was an issue saving storage data. Check your connection or reload to start over.',
						title: 'We ran into a problem',
						fatal: false
					})
				}
			}
		})
	}

	const _sendAllPendingLogs = callback => {
		console.warn('This postMessage request is deprecated, logs are automatically enqueued and processed')
	}

	const _sendStorage = msg => {
		dispatchPendingLogs({type: 'addStorage', payload: {log: {...msg, queueId: uuidv4()}}})
	}

	/*********************** helper methods ***********************/

	const _initScoreScreenUrl = () => {
		let _scoreScreenURL = ''
			if (isPreview) {
				_scoreScreenURL = `${window.BASE_URL}scores/preview/${instanceId}`
			} else if (isEmbedded) {
				_scoreScreenURL = `${window.BASE_URL}scores/embed/${instanceId}#play-${playId}`
			} else {
				_scoreScreenURL = `${window.BASE_URL}scores/${instanceId}#play-${playId}`
			}
		return _scoreScreenURL
	}

	const _setHeight = h => {
		const min_h = inst.widget.height
		let desiredHeight = Math.max(h, min_h)
		setAttributes((oldData) => ({...oldData, height: `${desiredHeight}px`}))
	}

	const _setVerticalScroll = location => {
		const containerElement = frameRef.current
		const calculatedLocation = window.scrollY + containerElement.getBoundingClientRect().y + location
		window.scrollTo(0, calculatedLocation)
	}

	const _onLoadFail = msg => setAlert({
		msg: msg,
		title: 'Failure!',
		fatal: true
	})

	const _beforeUnload = e => {
		if (inst.widget.is_scorable === '1' && !isPreview && playState !== 'end') {
			const confirmationMsg = 'Wait! Leaving now will forfeit this attempt. To save your score you must complete the widget.'
			e.returnValue = confirmationMsg
			e.preventDefault()
			return confirmationMsg
		} else {
			return undefined
		}
	}

	/*********************** component rendering ***********************/

	let previewBarRender = null
	if (isPreview) {
		previewBarRender = (
			<header className='preview-bar'
				style={{width: attributes.width !== '0px' ? attributes.width : ''}}>
			</header>
		)
	}

	let loadingRender = null
	if (attributes.loading) {
		loadingRender = (
			<LoadingIcon size='lrg'
				position='absolute'
				top={`0px`}
				left={`0px`}
			/>
		)
	}

	let alertDialogRender = null
	if (!!alert.msg && !!alert.title) {
		alertDialogRender = (
			<Alert
				msg={alert.msg}
				title={alert.title}
				fatal={alert.fatal}
				showLoginButton={false}
				onCloseCallback={() => {
					setAlert({msg: '', title: '', fatal: false})
				}} />
		)
	}

	let footerRender = null
	if (!isPreview && showFooter) {
		footerRender = <section className='player-footer' style={{ width: attributes.width !== '0px' ? attributes.width : 'auto' }}>
			<a className="materia-logo" href={window.BASE_URL} target="_blank"><img src="/img/materia-logo-thin.svg" alt="materia logo" /></a>
			{ inst?.widget?.player_guide ? <a href={`${window.BASE_URL}widgets/${inst.widget.dir}players-guide`} target="_blank">Player Guide</a> : null }
		</section>
	}

	return (
		<section className={`widget ${isPreview ? 'preview' : ''}`}
			style={{display: attributes.loading ? 'none' : 'block'}}>
			{ previewBarRender }
			<div className='center'
				ref={centerRef}
				style={{minHeight: minHeight + 'px',
					minWidth: minWidth + 'px',
					width: attributes.width !== '0px' ? attributes.width : 'auto',
					height: attributes.height !== '0px' ? attributes.height : '100%'}}>
				{ alertDialogRender }
				<iframe src={ attributes.htmlPath }
					id='container'
					className='html'
					scrolling='yes'
					ref={frameRef}
				/>
				{ loadingRender }
			</div>
			{ footerRender }
		</section>
	)
}

export default WidgetPlayer