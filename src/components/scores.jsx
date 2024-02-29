import React, { useState, useEffect, useRef} from 'react'
import { apiGetWidgetInstance, apiGetWidgetInstanceScores, apiGetGuestWidgetInstanceScores, apiGetScoreSummary, apiGetScoreDistribution, apiGetWidgetInstancePlayScores } from '../util/api'
import { useQuery } from 'react-query'
import ScoreOverview from './score-overview'
import ScoreDetails from './score-details'
import SupportInfo from './support-info'
import LoadingIcon from './loading-icon'

import './scores.scss'

const STATE_RESTRICTED = 'restricted'
const STATE_INVALID = 'invalid'
const STATE_EXPIRED = 'expired'

const Scores = ({ inst_id, play_id, single_id, send_token, isEmbedded, isPreview }) => {

	const [playId, setPlayId] = useState(null)
	const [previewInstId, setPreviewInstId] = useState(null)


	// attemptDates is an array of attempts, [0] is the newest
	const [attemptDates, setAttemptDates] = useState([])
	const [attempts, setAttempts] = useState([])
	// current attempt is the index of the attempt (the 1st attempt is attempts.length)
	const [currentAttempt, setCurrentAttempt] = useState(null)
	const [attemptsLeft, setAttemptsLeft] = useState(0)
	const [attemptNum, setAttemptNum] = useState(null)

	const [overview, setOverview] = useState()
	const [details, setDetails] = useState([])
	const [prevAttemptOpen, setprevAttemptOpen] = useState(false)

	// set to one of the state constants above if an error state manifests
	const [errorState, setErrorState] = useState(null)

	const [showScoresOverview, setShowScoresOverview] = useState(true)
	const [showResultsTable, setShowResultsTable] = useState(true)
	const [scoreTable, setScoreTable] = useState(null)

	const [guestAccess, setGuestAccess] = useState(null)
	const [attributes, setAttributes] = useState({
		hidePlayAgain: true,
		hidePreviousAttempts: true
	})

	const [playAgainUrl, setPlayAgainUrl] = useState(null)

	const [customScoreScreen, setCustomScoreScreen] = useState({
		htmlPath: null,
		type: null,
		qset: null,
		scoreTable: null,
		show: false,
		loading: true,
		ready: false
	})

	const scoreHeaderRef = useRef(null)
	const scoreWidgetRef = useRef(null)

	// Gets widget instance loads qset
  // No login required
	const { isLoading: instanceIsLoading, data: instance } = useQuery({
		queryKey: ['widget-inst', inst_id],
		queryFn: () => apiGetWidgetInstance(inst_id, true),
		enabled: !!inst_id,
		staleTime: Infinity,
	})

	// Gets widget instance scores
	// Because of how we handle the results object, we can't follow-up via useEffect targeting instanceScores
	// As a result, instanceScores is never read.
	const { isLoading: scoresAreLoading, data: instanceScores, refetch: loadInstanceScores } = useQuery({
		queryKey: ['inst-scores', inst_id, send_token],
		queryFn: () => apiGetWidgetInstanceScores(inst_id, send_token),
		enabled: false, // enabled is set to false so the query can be manually called with the refetch function
		staleTime: Infinity,
		refetchOnWindowFocus: false,
		onSettled: (result) => {
			if (result && result.type == 'error') setErrorState(STATE_RESTRICTED)
			else {
				_populateScores(result.scores)
				setAttemptsLeft(result.attempts_left)
			}
		}
	})

	// Gets guest widget instance scores
	// important note: play_id is only set when the user first visits the score screen after completing a guest instance
	// otherwise, single_id will contain the play ID and play_id will be null
	const guestPlayId = play_id ? play_id : single_id
	const { data: guestScores, refetch: loadGuestScores } = useQuery({
		queryKey: ['guest-scores', inst_id, guestPlayId],
		queryFn: () => apiGetGuestWidgetInstanceScores(inst_id, guestPlayId),
		enabled: false, // enabled is set to false so the query can be manually called with the refetch function
		staleTime: Infinity,
		retry: false,
		refetchOnWindowFocus: false,
		onSettled: (result) => {
			if (result && result.type == 'error') setErrorState(STATE_RESTRICTED)
			else _populateScores(result)
		}
	})

	// Gets widget instance play scores when playId
	// or previewInstId are changed
	const { data: playScores } = useQuery({
		queryKey: ['play-scores', playId, previewInstId],
		queryFn: () => apiGetWidgetInstancePlayScores(playId, previewInstId),
		staleTime: Infinity,
		enabled: (!!playId || !!previewInstId),
		retry: false,
		refetchOnWindowFocus: false,
		onSettled: (result) => {
			if (isPreview && (!result || result.length < 1)) {
				setAttributes({...attributes, href: `/preview/${inst_id}/${instance?.clean_name}`})
				setErrorState(STATE_EXPIRED)
			} else if (!result || result.length < 1) {
				setErrorState(STATE_INVALID)
			}
		}
	})

	// Gets score distribution
	const { refetch: loadScoreDistribution } = useQuery({
		queryKey: ['score-dist', inst_id],
		queryFn: () => apiGetScoreDistribution(inst_id),
		enabled: false,
		staleTime: Infinity,
		onSettled: (data) => {
			_sendToWidget('scoreDistribution', [data])
		}
	})

	useEffect(() => {
		window.addEventListener('hashchange', listenToHashChange)

		return () => {
			window.removeEventListener('hashchange', listenToHashChange)
		}
	}, [currentAttempt])

	useEffect(() => {
		// if customScoreScreen is not loading
		// meaning it has 1) loaded or 2) does not exist
		if (!customScoreScreen.loading) {
			// setup the postmessage listener
			window.addEventListener('message', _onPostMessage, false)

			_displayWidgetInstance()

			// cleanup this listener
			return () => {
				window.removeEventListener('message', _onPostMessage, false);
			}
		}
	}, [
		customScoreScreen.loading,
		instance,
	])

	useEffect(() => {
		// Fetch score data based on instance access
		if (instance) {
			setGuestAccess(instance.guest_access)
			// Preview? Set certain attributes that wouldn't be assigned otherwise
			if (isPreview) {
				setPreviewInstId(instance.id)
				setPlayId(null)
				setAttributes({ ...attributes, href: `/preview/${inst_id}/${instance.clean_name}`, hidePlayAgain: false })
			}
			// Single play session
			else if (single_id) {
				setPlayId(single_id)
				setPreviewInstId(null)
			}
			// Guest play session
			else if (instance.guest_access) {
				setAttributes({ ...attributes, href: `/${isEmbedded ? 'embed' : 'play'}/${inst_id}/${instance.clean_name}`, hidePlayAgain: false })
				loadGuestScores()
			}
			// User play session
			else loadInstanceScores()
		}
	}, [instance])

	// Initializes the custom score screen
	useEffect(() => {
		if (instance) {
			let enginePath
			const score_screen = instance.widget.score_screen
			// custom score screen exists?
			if (score_screen && scoreTable) {
				const splitSpot = score_screen.lastIndexOf('.')
				if (splitSpot != -1) {
					if (score_screen.substring(0, 4) == 'http') {
						// allow player paths to be absolute urls
						enginePath = score_screen
					} else {
						// link to the static file
						enginePath = window.WIDGET_URL + instance.widget.dir + score_screen
					}
				}
				// first time loading the custom score screen
				if (customScoreScreen.loading == true) {
					setCustomScoreScreen({
						...customScoreScreen,
						htmlPath: enginePath + '?' + instance.widget.created_at,
						qset: instance.qset,
						scoreTable: scoreTable,
						type: 'html',
						loading: false,
						show: true,
					})
				// custom score screen loaded previously - scoreTable updated, indicating a different play selected
				// pass the message along to the score screen
				} else if (customScoreScreen.ready) _sendWidgetUpdate()

			// no score screen - set loading to false regardless now that we know
			// doing so kicks off _displayWidgetInstance and initializes the postMessage listener
			} else if (instance.widget && scoreTable) {
				setCustomScoreScreen({ ...customScoreScreen, loading: false })
			}
		}
	}, [instance, scoreTable])

	// _displayAttempts
	useEffect(() => {
		if (!!attempts) {
			if (attempts instanceof Array && attempts.length > 0) {
				let matchedAttempt = false
				// Reverse attempts so that the most recent attempt has the highest index
				attempts.reverse()

				// attemptDates is used to populate the overview data in displayWidgetInstance, it's just assembled here.
				let dates = [ ...attemptDates ]

				// sort added here so it displays the correct date with the attempt and score
				attempts.forEach((a, i) => {
					const d = new Date(a.created_at * 1000)

					// attemptDates is used to populate the overview data in displayWidgetInstance, it's just assembled here.
					let date = { ...dates[i] }
					date = d.getMonth() + 1 + '/' + d.getDate() + '/' + d.getFullYear()
					dates[i] = date
					setAttemptDates(dates)

					if (play_id === a.id) {
						matchedAttempt = attempts.length // sets to uri attempt to the most resent one
					}
				})

				if (isPreview) {
					setCurrentAttempt(1)
				} else if (matchedAttempt !== false && attempts.length > 1) {
					// we only want to do this if there's more than one attempt. Otherwise it's a guest widget
					// or the score is being viewed by an instructor, so we don't want to get rid of the playid
					// in the hash
					window.location.hash = `#attempt-${matchedAttempt}`

				} else if (getAttemptNumberFromHash() === undefined) {
					window.location.hash = `#attempt-${attempts.length - 1}`
				} else {

					const hash = getAttemptNumberFromHash()
					if (currentAttempt != hash) {
						setCurrentAttempt(hash)
					}
				}
			}
		}
	}, [attempts])

	useEffect(() => {
		if (!!currentAttempt) {
			if (guestAccess) {
				setPlayId(play_id)
			} else {
				const hash = getAttemptNumberFromHash()
				setPlayId(attempts[hash - 1].id)
			}
		}
	}, [currentAttempt])

	useEffect(() => {

		if (playScores && playScores.length > 0) {

			const deets = playScores[0]
			setDetails([...deets.details])

			let score

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

			if (showScoresOverview) {
				for (var tableItem of Array.from(deets.overview.table)) {
					if (tableItem.value.constructor === String) {
						tableItem.value = parseFloat(tableItem.value)
					}
					tableItem.value = tableItem.value.toFixed(2)
				}

				setOverview(deets.overview)
				setAttemptNum(currentAttempt)
			}

			const referrerUrl = deets.overview.referrer_url
			if (deets.overview.auth === 'lti' && !!referrerUrl && referrerUrl.indexOf(`/scores/${inst_id}`) === -1) {
				setPlayAgainUrl(referrerUrl)
			} else if (!single_id) {
				setPlayAgainUrl(attributes.href)
			}

			setScoreTable(deets.details[0].table)
		}
	}, [playScores])

	useEffect(() => {
		if (instance && !single_id) {
			// show play again button?
			if (instance.attempts <= 0 || parseInt(attemptsLeft) > 0 || isPreview) {
				const prefix = (() => {
					if (isEmbedded && isPreview) return '/preview-embed/'
					if (isEmbedded) return '/embed/'
					if (isPreview) return '/preview/'
					return '/play/'
				})()

				let href = prefix + instance.id + '/' + instance.clean_name
				if (typeof window.LAUNCH_TOKEN !== 'undefined' && window.LAUNCH_TOKEN !== null) {
					href += `?token=${window.LAUNCH_TOKEN}`
				}

				setAttributes({
					...attributes,
					href: href,
					hidePlayAgain: false
				})
			} else {
				// if there are no attempts left, hide play again
				setAttributes({
					...attributes,
					hidePlayAgain: true
				})
			}
		}
	}, [attemptsLeft])

	const listenToHashChange = () => {
		const hash = getAttemptNumberFromHash()
		if (currentAttempt != hash) setCurrentAttempt(hash)
	}

	const _populateScores = (scores) => {
		if (!scores || scores.length < 1) {
			// score request was not in error, but request is empty
			setErrorState(STATE_INVALID)

		} else {
			// Round scores
			for (let attemptScore of Array.from(scores)) {
				attemptScore.roundedPercent = String(parseFloat(attemptScore.percent).toFixed(2))
			}

			setAttempts(scores)
		}
	}

	// only referenced once, after instance is loaded
	const _displayWidgetInstance = () => {
		// Build the data for the overview section
		let overview = {
			title: instance.name,
			dates: attemptDates,
		}

		// Modify display of several elements after HTML is outputted
		const lengthRange = Math.floor(instance.name.length / 10)
		let textSize = 24
		let paddingSize = 16

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

		overview.headerStyle = {
			'fontSize': textSize,
			'paddingTop': paddingSize,
		}

		setAttributes({...attributes, ...overview, hidePreviousAttempts: !!single_id || attempts.length < 2 })
	}

	const _onPostMessage = (e) => {
		const origin = `${e.origin}/`
		if (origin === window.STATIC_CROSSDOMAIN || origin === window.BASE_URL) {
			const msg = JSON.parse(e.data)
			switch (msg.source) {
				case 'score-core':
					switch (msg.type) {
						case 'start':
							return _sendWidgetInit()
						case 'setHeight':
							return _setHeight(msg.data[0])
						case 'hideResultsTable':
							return (setShowResultsTable(false))
						case 'hideScoresOverview':
							return (overview?.complete ? setShowScoresOverview(false) : setShowScoresOverview(true))
						case 'requestScoreDistribution':
							return loadScoreDistribution()
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

	// broadcasts a postMessage to inform Obojobo, or other platforms, about a score event
	// Bypasses the LTI interface and provides an alternative for platforms that use embedded Materia to listen for a score
	const sendPostMessage = (score) => {
		if (parent.postMessage && JSON.stringify) {
			parent.postMessage(
				JSON.stringify({
					type: 'materiaScoreRecorded',
					source: 'score-controller',
					widget: instance,
					score,
				}),
				'*'
			)
		}
	}

	/****** helper methods ******/

	const getAttemptNumberFromHash = () => {
		const match = window.location.hash.match(/^#attempt-(\d+)/)
		if (match && match[1] != null && !isNaN(match[1])) {
			return match[1]
		}
		return attempts.length
	}

	const _sendToWidget = (type, args) => {
		return scoreWidgetRef.current.contentWindow.postMessage(
			JSON.stringify({ type, data: args }),
			window.STATIC_CROSSDOMAIN
		)
	}

	// this is only called in response from the score-core
	// it will not be called for default score screens
	const _sendWidgetInit = () => {
		if (customScoreScreen.scoreTable == null || customScoreScreen.qset == null || scoreWidgetRef.current == null) {
			// Custom score screen failed to load, load default overview instead
			setCustomScoreScreen({ ...customScoreScreen, loading: true, show: false })
			setShowResultsTable(true)
			setShowScoresOverview(true)
			return
		}
		setCustomScoreScreen({ ...customScoreScreen, ready: true })

		_sendToWidget('initWidget', [customScoreScreen.qset, customScoreScreen.scoreTable, instance, isPreview, window.MEDIA_URL])
	}

	// tell the custom score screen that the selected attempt/play has changed, and pass the new scoreTable accordingly
	const _sendWidgetUpdate = () => {
		_sendToWidget('updateWidget', [instance.qset, scoreTable])
	}

	const _setHeight = (h) => {
		const min_h = instance.widget.height
		let desiredHeight = Math.max(h, min_h)
		scoreWidgetRef.current.style.height = `${desiredHeight}px`
	}

	const attemptClick = () => {
		if (isMobile.any()) {
			setprevAttemptOpen(false)
		}
	}

	/******* DOM element rendering ********/

	// Render error states, if any are active
	let errorStateRender = null
	if (errorState != null) {
		switch (errorState) {
			case STATE_EXPIRED:
				errorStateRender = (
					<div className="expired container general">
						<section className="page score_expired">
							<h2 className="logo">The preview score for this widget has expired.</h2>
							<p>Preview scores are only available immediately after previewing a widget.</p>
							<a className="action_button" href={attributes.href ? attributes.href : '#'}>Preview Again</a>
						</section>
					</div>
				)
				break
			case STATE_INVALID:
				errorStateRender = (
					<div className="invalid container general">
						<section className="page score_restrict">
							<h2 className="logo">Play ID Invalid</h2>
							<p>Well, that's awkward. We couldn't find any play scores to show you. Some common issues associated with this message:</p>
							<ul>
								<li>Materia doesn't think you have the right permissions to view this score.</li>
								<li>There was an issue with displaying the score screen in this particular context - have you tried accessing it from the widget's Student Activity section or your profile page?</li>
							</ul>
							<p>It might be worth reaching out to technical support to report the issue:</p>
							<SupportInfo />
						</section>
					</div>
				)
				break
			case STATE_RESTRICTED:
				errorStateRender = (
					<div className="score_restrict container general">
						<section className="page score_restrict">
							<h2 className="logo">You don't have permission to view this page.</h2>

							<p>You may need to:</p>
							<ul>
								<li>Make sure the score you're trying to access belongs to you or your student.</li>
								<li>Try to access this score through your profile page.</li>
							</ul>

							<SupportInfo />
						</section>
					</div>
				)
		}
	}

	let previousAttempts = null
	if (!attributes.hidePreviousAttempts && !isPreview && !guestAccess) {

		let attemptList = attempts.map((attempt, index) => {
			return (
				<li key={index}>
					<a
						href={`#attempt-${index + 1}`}
						onClick={attemptClick}
					>
						Attempt {index + 1}:
						<span className="score">{attempt.roundedPercent}%</span>
						<span className="date">{attemptDates[index]}</span>
					</a>
				</li>
			)
		}).reverse()
		// Reverses attempt list so that the most recent appears at top

		previousAttempts = (
			<nav
				className={`header-element previous-attempts ${prevAttemptOpen ? 'open' : ''}`}
				onMouseOver={() =>!prevAttemptOpen && setprevAttemptOpen(true)}
				onMouseOut={() => prevAttemptOpen && setprevAttemptOpen(false)}
			>
				<h1 onClick={() => !prevAttemptOpen && setprevAttemptOpen(true)}>
					Prev. Attempts
				</h1>
				<ul>
					{attemptList}
				</ul>
			</nav>
		)
	}

	let playAgainBtn = null
	if (!attributes.hidePlayAgain) {
		playAgainBtn = (
			<nav className="play-again header-element">
				<h1>
					<a id="play-again" className="action_button" href={playAgainUrl}>
						{isPreview ? 'Preview' : 'Play'} Again
						{attemptsLeft > 0 ? <span>({attemptsLeft} Left)</span> : <></>}
					</a>
				</h1>
			</nav>
		)
	}

	let scoreHeader = null
	if (!errorState) {
		scoreHeader = (
			<header className={`header score-header ${isPreview ? 'preview' : ''}`}>
				{previousAttempts}
				<h1 className="header-element widget-title" ref={scoreHeaderRef} style={attributes.headerStyle ? attributes.headerStyle : {}}>{attributes.title ? attributes.title : ''}</h1>
				{playAgainBtn}
			</header>
		)
	}

	let overviewRender = null
	if (!errorState && showScoresOverview && !!overview) {
		if (customScoreScreen.show && !customScoreScreen.ready) {
			overviewRender = (
				<section className={`overview ${isPreview ? 'preview' : ''}`}>
					<div className='loading-icon-holder'><LoadingIcon size='med' /></div>
				</section>
			)
		}
		else {
			overviewRender = <ScoreOverview
				inst_id={inst_id}
				single_id={single_id}
				overview={overview}
				attemptNum={attemptNum}
				isPreview={isPreview}
				guestAccess={guestAccess} />
		}

	}

	let customScoreScreenRender = null
	if (!errorState && customScoreScreen.show) {
		customScoreScreenRender = (
			<iframe ref={scoreWidgetRef}
				id="container"
				className={`html ${showScoresOverview ? 'margin-above' : ''}${showResultsTable ? 'margin-below' : ''}${!overview?.complete ? ' incomplete' : ''}`}
				src={customScoreScreen.htmlPath}>
			</iframe>
		)
	}

	let detailsRender = null
	if (!errorStateRender && customScoreScreen.show && !customScoreScreen.ready) {
		detailsRender = (
			<section className={`overview ${isPreview ? 'preview' : ''}`}>
				<div className='loading-icon-holder'><LoadingIcon size='med' /></div>
			</section>
		)
	} else if (!errorStateRender && showResultsTable) {
		detailsRender = <ScoreDetails details={details} complete={overview?.complete} />
	}

	return (
		<article className={`container ${ instanceIsLoading || scoresAreLoading ? 'loading' : 'ready'}`}>
			<div className='loading-icon-holder'><LoadingIcon size='med' /></div>
			{scoreHeader}
			{overviewRender}
			{customScoreScreenRender}
			{detailsRender}
			{errorStateRender}
		</article>
	)
}

export default Scores
