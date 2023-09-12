import React, { useState, useEffect, useRef} from 'react'
import { apiGetWidgetInstance, apiGetWidgetInstanceScores, apiGetGuestWidgetInstanceScores, apiGetScoreSummary, apiGetScoreDistribution, apiGetWidgetInstancePlayScores } from '../util/api'
import { useQuery } from 'react-query'
import ScoreOverview from './score-overview'
import ScoreDetails from './score-details'
import SupportInfo from './support-info'
import LoadingIcon from './loading-icon'

import './scores.scss'

const Scores = ({ inst_id, play_id, single_id, send_token, isEmbedded, isPreview }) => {
	const [guestAccess, setGuestAccess] = useState(null)
	const [invalid, setInvalid] = useState(null)
	// attemptDates is an array of attempts, [0] is the newest
	const [attemptDates, setAttemptDates] = useState([])
	const [attempts, setAttempts] = useState([])
	// current attempt is the index of the attempt (the 1st attempt is attempts.length)
	const [currentAttempt, setCurrentAttempt] = useState(null)
	const [attemptsLeft, setAttemptsLeft] = useState(0)
	const [attemptNum, setAttemptNum] = useState(null)

	const [details, setDetails] = useState([])
	const [overview, setOverview] = useState()
	const [prevAttemptClass, setPrevAttemptClass] = useState(null)

	const [restricted, setRestricted] = useState(null)
	const [expired, setExpired] = useState(null)
	const [showScoresOverview, setShowScoresOverview] = useState(true)
	const [showResultsTable, setShowResultsTable] = useState(true)
	const [scoreTable, setScoreTable] = useState(null)

	const [playId, setPlayId] = useState(null)
	const [previewInstId, setPreviewInstId] = useState(null)

	const [attributes, setAttributes] = useState({
		hidePlayAgain: true
	})

	const [customScoreScreen, setCustomScoreScreen] = useState({
		htmlPath: null,
		type: null,
		qset: null,
		scoreTable: null,
		show: false,
		loading: true,
		ready: false
	})
	
	const [playAgainUrl, setPlayAgainUrl] = useState(null)
	const scoreHeaderRef = useRef(null)
	const [hidePreviousAttempts, setHidePreviousAttempts] = useState(null)
	const [widget, setWidget] = useState(null)
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
			if (result && result.type == 'error') setRestricted(true)
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
	const { isLoading: guestScoresAreLoading, data: guestScores, refetch: loadGuestScores } = useQuery({
		queryKey: ['guest-scores', inst_id, guestPlayId],
		queryFn: () => apiGetGuestWidgetInstanceScores(inst_id, guestPlayId),
		enabled: false, // enabled is set to false so the query can be manually called with the refetch function
		staleTime: Infinity,
		retry: false,
		refetchOnWindowFocus: false,
		onSettled: (result) => {
			if (result && result.type == 'error') setRestricted(true)
			else _populateScores(result)
		}
	})

	// Gets widget instance play scores when playId
	// or previewInstId are changed
	// playId and previewInstId are initialized in _getScoreDetails
	// If previewInstId is null, verifies that instance is playable by current user
	// If previewInstId is not null, verifies player session
	// If the play details or preview logs are empty, sets expired to true
	const { isLoading: playScoresAreLoading, data: playScores, refetch: loadPlayScores } = useQuery({
		queryKey: ['play-scores', playId, previewInstId],
		queryFn: () => apiGetWidgetInstancePlayScores(playId, previewInstId),
		staleTime: Infinity,
		enabled: false,
		retry: false,
		refetchOnWindowFocus: false,
		onSettled: (result) => {
			if (!result || result.length < 1) {
				setExpired(true)
			}
		}
	})

	// Gets score distribution
	const { isLoading: scoreDistributionIsLoading, data: scoreDistribution, refetch: loadScoreDistribution } = useQuery({
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
	}, [])

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

	// Initializes the custom score screen
	useEffect(() => {
		if (instance) {
			let enginePath
			setGuestAccess(instance.guest_access)

			if (isPreview) {
				setPreviewInstId(instance.id)
				setPlayId(null)
			} else if (single_id) {
				setPlayId(single_id)
				setPreviewInstId(null)
			}

			const score_screen = instance.widget.score_screen
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
				setCustomScoreScreen({
					htmlPath: enginePath + '?' + instance.widget.created_at,
					qset: instance.qset,
					scoreTable: scoreTable,
					type: 'html',
					loading: false,
					show: true,
					ready: false
				})
			} else if (instance.widget && scoreTable) {
				setCustomScoreScreen({ ...customScoreScreen, loading: false })
			} 
		}
	}, [instance, scoreTable])

	// _getInstanceScores
	// only for non-preview scores, guest or normal
	useEffect(() => {
		if (guestAccess !== null && !isPreview) {
			if (guestAccess) {
				loadGuestScores()
			} else if (!single_id) {
				// play_id is only present when the score screen is visited from an instance play or the profile page
				// if visited from My Widgets, single_id is populated instead and this call is unnecessary
				loadInstanceScores()
			}
		}
	}, [guestAccess])

	// instance scores are not loaded for previews - request play scores directly
	useEffect(() => {
		if (previewInstId) loadPlayScores()
	}, [previewInstId])

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
					// we only want to do this if there's more than one attempt. Otherwise it's a guest widget
					// or the score is being viewed by an instructor, so we don't want to get rid of the playid
					// in the hash
				} else if (matchedAttempt !== false && attempts.length > 1) {
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
		if (!!playId) 
		{
			loadPlayScores()
		}
	}, [playId])

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
			// customScoreScreen.ready is applied when the scorecore is ready for startup (regardless of whether show is true or false)
			// even if the widget doesn't have a custom score screen, we defer this function call until we're sure the resultsTable is going to be displayed
			if (showResultsTable && customScoreScreen.ready) {
				addCircleToDetailTable(deets.details)
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
			if (!single_id && (instance.attempts <= 0 || parseInt(attemptsLeft) > 0 || isPreview)) {
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
				setAttemptsLeft(attemptsLeft)
				
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
			setExpired(true)
		} else {
			// Round scores
			for (let attemptScore of Array.from(scores)) {
				attemptScore.roundedPercent = String(parseFloat(attemptScore.percent).toFixed(2))
			}
			if (!single_id) {
				setAttempts(scores)
			}
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

		setHidePreviousAttempts(single_id)
		setAttributes({...attributes, ...overview})
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
							return (setShowScoresOverview(false))
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

	const _sendWidgetInit = () => {
		if (customScoreScreen.scoreTable == null || customScoreScreen.qset == null || scoreWidgetRef.current == null) {
			// Custom score screen failed to load, load default overview instead
			setCustomScoreScreen({ ...customScoreScreen, loading: true, show: false })
			setShowResultsTable(true)
			setShowScoresOverview(true)
			setInvalid(true)
			return
		}
		setCustomScoreScreen({ ...customScoreScreen, ready: true })

		_sendToWidget('initWidget', [customScoreScreen.qset, customScoreScreen.scoreTable, instance, isPreview, window.MEDIA_URL])
	}

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
			setPrevAttemptClass('')
		}
	}

	/******* DOM element rendering ********/

	let previousAttempts = null
	if (!hidePreviousAttempts && !isPreview && !guestAccess) {

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
				className={`header-element previous-attempts ${prevAttemptClass}`}
				onMouseOver={() => setPrevAttemptClass('open')}
				onMouseOut={() => setPrevAttemptClass('')}
			>
				<h1 onClick={() => setPrevAttemptClass('open')}>
					Prev. Attempts
				</h1>
				<ul onMouseOver={() => setPrevAttemptClass('open')}>
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
	if (!restricted && !expired) {
		scoreHeader = (
			<header className={`header score-header ${isPreview ? 'preview' : ''}`}>
				{previousAttempts}
				<h1 className="header-element widget-title" ref={scoreHeaderRef} style={attributes.headerStyle ? attributes.headerStyle : {}}>{attributes.title ? attributes.title : ''}</h1>
				{playAgainBtn}
			</header>
		)
	}

	let overviewRender = null
	if (!restricted && !expired && showScoresOverview && !!overview) {

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
				overview={overview}
				attemptNum={attemptNum}
				isPreview={isPreview}
				guestAccess={guestAccess}
				restricted={restricted}
				expired={expired} />
		}

	}

	let customScoreScreenRender = null
	if (customScoreScreen.show && !restricted && !expired) {
		customScoreScreenRender = (
			<iframe ref={scoreWidgetRef} id="container"
				className={`html ${showScoresOverview ? 'margin-above' : ''}${showResultsTable ? 'margin-below' : ''}`}
				scrolling="yes"
				src={customScoreScreen.htmlPath}
				fullscreen-dir="true">
			</iframe>
		)
	}

	let detailsRender = null
	if (customScoreScreen.show && !customScoreScreen.ready) {
		detailsRender = (
			<section className={`overview ${isPreview ? 'preview' : ''}`}>
				<div className='loading-icon-holder'><LoadingIcon size='med' /></div>
			</section>
		)
	} else if (showResultsTable) {
		detailsRender = <ScoreDetails details={details} complete={overview?.complete} />
	}

	let expiredRender = null
	if (expired) {
		expiredRender = (
			<div className="expired container general">
				<section className="page score_expired">
					<h2 className="logo">The preview score for this widget has expired.</h2>
					<a className="action_button" href={widget ? widget.href : '#'}>Preview Again</a>
				</section>
			</div>
		)
	}

	let restrictedRender = null
	if (restricted) {
		restrictedRender = (
			<div className="score_restrict container general">
				<section className="page score_restrict">
					<h2 className="logo">You don't have permission to view this page.</h2>

					<p>You may need to:</p>
					<ul>
						<li>Make sure the score you're trying to access belongs to you or your student.</li>
						<li>Try to access this score through your profile page.</li>
						<li>Check out our documentation.</li>
					</ul>

					<SupportInfo />
				</section>
			</div>
		)
	}

	return (
		<article className={`container ${ instanceIsLoading || scoresAreLoading ? 'loading' : 'ready'}`}>
			<div className='loading-icon-holder'><LoadingIcon size='med' /></div>
			{scoreHeader}
			{overviewRender}
			{customScoreScreenRender}
			{detailsRender}
			{expiredRender}
			{restrictedRender}
		</article>
	)
}

export default Scores
