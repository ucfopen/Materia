import React, { useState, useEffect, useRef} from 'react'
import { useQuery } from 'react-query'
import { apiGetWidgetInstance, apiGetWidgetInstanceScores, apiGetWidgetInstancePlayScores, apiGetWidgetInstancePreviewScores } from '../util/api'

import LoadingIcon from './loading-icon'
import ScoreOverview from './score-overview'
import ScoreDetails from './score-details'
import SupportInfo from './support-info'

import './scores.scss'

const STATE_RESTRICTED = 'restricted'
const STATE_INVALID = 'invalid'
const STATE_EXPIRED = 'expired'

const Scores = ({ instID, playID: playIDProp, userID, token, isEmbedded, isPreview, isSingle}) => {

	const [playID, setPlayID] = useState(playIDProp)
	const [errorState, setErrorState] = useState(null)
	const [attemptsLeft, setAttemptsLeft] = useState(0)
	const [currentAttempt, setCurrentAttempt] = useState(null)

	const [attempts, setAttempts] = useState([])

	const [playData, setPlayData] = useState({
		overview: null,
	})

	const [attributes, setAttributes] = useState({
		showScoresOverview: true,
		showResultsTable: true,
		hidePlayAgain: true,
		href: '',
		hidePreviousAttempts: isPreview || isSingle
	})

	const [keepPrevOpen, setKeepPrevOpen] = useState(false)
	const [prevAttemptOpen, setprevAttemptOpen] = useState(false)

	const [customScoreScreen, setCustomScoreScreen] = useState({
		htmlPath: null,
		type: null,
		show: false,
		loading: true,
		ready: false
	})

	const scoreWidgetRef = useRef(null)

	/*
	Grab instance information: required for all score screen types
	*/
	const { isLoading: instanceIsLoading, data: instance} = useQuery({
		queryKey: ['widget-inst', instID],
		queryFn: () => apiGetWidgetInstance(instID),
		enabled: !!instID,
		staleTime: Infinity,
	})

	/*
	Grab instance score data for a given user
		Only requested for score screens displayed at end-of-play flow
		Also disabled for guest plays, preview plays
	*/
	const { isLoading: scoresAreLoading, data: instanceScores, error: instanceScoresError, refetch: loadInstanceScores } = useQuery({
		queryKey: ['inst-scores', instID],
		queryFn: () => {
			return apiGetWidgetInstanceScores(instID, userID)
		},
		enabled: !isPreview && !isSingle && !!userID && !!instID,
		staleTime: Infinity,
		refetchOnWindowFocus: false,
		retry: false,
	})

	/*
	Grab play-specific score data. Bound to the current play (or preview) ID.
	*/
	const { data: playScores, error: playScoresError } = useQuery({
		queryKey: ['play-scores', playID],
		queryFn: () => {
			if (isPreview) return apiGetWidgetInstancePreviewScores(playID, instID)
			else return apiGetWidgetInstancePlayScores(playID)
		},
		staleTime: Infinity,
		enabled: !!playID && !!instance,
		refetchOnWindowFocus: false,
		retry: false
	})

	/*
	Setup state information based on instance data:
		- play again URL
		- feature visibility toggles
		- custom score screen (if used)
	*/
	useEffect(() => {
		if (!!instance) {

			let path = (() => {
				if (isEmbedded) return instance.embed_url
				if (isPreview) return instance.preview_url
				return instance.play_url
			})()
			if (token) path = `${path}?token=${token}`

			const score_screen = instance.widget.score_screen
			let enginePath
			if (score_screen) {
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
				if (customScoreScreen.loading == true) {
					setCustomScoreScreen({
						...customScoreScreen,
						htmlPath: enginePath + '?' + instance.widget.created_at,
						type: 'html',
						loading: false,
						show: true,
					})
				}
			}

			setAttributes({
				...attributes,
				href: path,
				title: instance.name,
				hidePlayAgain: !!instance.guest_access || isSingle,
				hidePreviousAttempts: instance.guest_access || attributes.hidePreviousAttempts,
				showResultsTable: !score_screen
			})
		}
	},[instance])

	/*
	Setup state information based on instance score data:
		- List of attempts
		- Remaining attempts
	*/
	useEffect(() => {
		if (!!instanceScores) {
			if (instanceScores.length < 1) {
				setErrorState(STATE_INVALID)
			} else {
				const scores = Array.from(instanceScores.scores)
				// Sort scores by created_at in ascending order (oldest first)
				scores.sort((a, b) => {
					return a.created_at - b.created_at
				})
				for (let score of scores) {
					score.roundedPercent = parseFloat(score.percent).toFixed(2)
					const d = new Date(score.created_at * 1000)
					const date = d.getMonth() + 1 + '/' + d.getDate() + '/' + d.getFullYear()
					score.date = date
				}
				setAttempts(scores)
				setAttemptsLeft(scores.attemptsLeft)
				const hash = getAttemptNumberFromHash()
				if (hash && scores.length >= hash) {
					setCurrentAttempt(parseInt(hash))
				}

				if (!attributes.hidePreviousAttempts && scores.length < 2) {
					setAttributes({...attributes, hidePreviousAttempts: true})
				}
			}
		} else if (!!instanceScoresError) {
			if (instanceScoresError.message == "Permission Denied") {
				setErrorState(STATE_RESTRICTED)
			} else {
				setErrorState(STATE_INVALID)
			}
		}
		// @TODO handle errors
	},[instanceScores, instanceScoresError])

	/*
	Setup state information based on play data
		- Score overview
		- Score table (which is passed to score screen)
	*/
	useEffect(() => {

		if (!!playScores && !playScoresError) {

			let overview = {
				...playScores.overview,
				score: Math.round(playScores.overview.score),
				table: Array.from(playScores.overview.table)
			}

			let details = {
				...playScores.details[0],
				table: Array.from(playScores.details[0].table)
			}
			
			for (let tableItem of details.table) {
				let score = parseFloat(tableItem.score)
				if (score != 0 && score != 100) {
					tableItem.score = score.toFixed(2)
				}
			}

			sendPostMessage(overview.score)
			if (attributes.showScoresOverview) {
				for (let tableItem of overview.table) {
					// convert each table value to a float if it's a string
					if (tableItem.value.constructor === String) {
						tableItem.value = parseFloat(tableItem.value)
					}
					// set to a fixed decimal length of 2
					tableItem.value = tableItem.value.toFixed(2)
				}
			}
			setPlayData((playData) => ({
				id: playID,
				overview: overview,
				qset: { ...playScores.qset },
				details: details
			}))
		}
		else if (!!playScoresError) {
			if (playScoresError.message == "Permission Denied") setErrorState(STATE_RESTRICTED)
			else if (isPreview) setErrorState(STATE_EXPIRED)
			else setErrorState(STATE_INVALID)
		}
		// @TODO handle errors
	}, [playScores, playScoresError])

	/*
	When parsed play data is updated, send it to the custom score screen (if enabled)
	*/
	useEffect(() => {
		if (!errorState && customScoreScreen.show) {
			sendToWidget('updateWidget', [playData.qset, playData.details.table])
		}
	},[playData.id])

	/*
	Setup postMessage listeners for communication between this frame and score screen
	*/
	useEffect(() => {
		if (!!playData.id) {
			if (!customScoreScreen.loading) {
				window.addEventListener('message', onPostMessage, false)
			}
			return () => {
				window.removeEventListener('message', onPostMessage, false)
			}
		}
	},[customScoreScreen.loading, playData.id])

	/*
	Setup hash change listener
	*/
	useEffect(() => {
		window.addEventListener('hashchange', listenToHashChange)

		return () => {
			window.removeEventListener('hashchange', listenToHashChange)
		}
	}, [currentAttempt])

	/*
	Update tracked playID when attempt hash changes
	*/
	useEffect(() => {
		if (!!currentAttempt) {
			if (instance?.guest_access || isSingle || isPreview) return false
			else {
				const hash = getAttemptNumberFromHash()
				setPlayID(attempts[hash - 1].id)
			}
		}
	},[currentAttempt])

	/*
	send postMessage to the score screen frame
	*/
	const sendToWidget = (type, args) => {
		return scoreWidgetRef.current.contentWindow.postMessage(
			JSON.stringify({ type, data: args }),
			window.STATIC_CROSSDOMAIN
		)
	}

	/*
	Score screen initialization and error handling
	*/
	const sendWidgetInit = () => {
		if (!errorState) { 
			if (customScoreScreen.loading || (customScoreScreen.show && scoreWidgetRef.current == null)) {
				setCustomScoreScreen({
					...customScoreScreen,
					show: false
				})
				setAttributes({
					...attributes,
					showScoresOverview: true,
					showResultsTable: true
				})
			}
			console.log("calling sendToWidget")
			sendToWidget('initWidget', [playData.qset, playData.details.table, instance, isPreview, window.MEDIA_URL])
		}
	}

	const setHeight = (h) => {
		const min_h = instance.widget.height
		let desiredHeight = Math.max(h, min_h)
		scoreWidgetRef.current.style.height = `${desiredHeight}px`
	}

	/*
	Handler for incoming postMessages from the custom score screen frame
	*/
	const onPostMessage = (e) => {
		const origin = `${e.origin}/`
		if (origin === window.STATIC_CROSSDOMAIN || origin === window.BASE_URL) {
			const msg = JSON.parse(e.data)
			switch (msg.source) {
				case 'score-core':
					switch (msg.type) {
						case 'start':
							return sendWidgetInit()
						case 'setHeight':
							return setHeight(msg.data[0])
						case 'hideResultsTable':
							return setAttributes({...attributes, showResultsTable: false})
						case 'hideScoresOverview':
							return (playData?.overview?.complete ? 
								setAttributes({...attributes, showScoresOverview: false}) :
								setAttributes({...attributes, showScoresOverview: true})
							)
						case 'requestScoreDistribution':
							// @TODO
							// return loadScoreDistribution()
							return false
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

	const listenToHashChange = () => {
		const hash = getAttemptNumberFromHash()
		if (currentAttempt != hash) setCurrentAttempt(hash)
	}

	const getAttemptNumberFromHash = () => {
		const match = window.location.hash.match(/^#attempt-(\d+)/)
		if (match && match[1] != null && !isNaN(match[1])) {
			const num = parseInt(match[1])
			return num > 0 ? num : undefined  // prevent 0
		}
		return attempts.length
	}

	let errorStateRender = null
	if (errorState != null) {
		switch (errorState) {
			case STATE_EXPIRED:
				errorStateRender = (
					<div className="expired container general">
						<section className="page score_expired">
							<h2 className="logo">The preview score for this widget has expired.</h2>
							<p>Preview scores are only available for a limited time after previewing a widget.</p>
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

	let priorAttempts = null
	if (!attributes.hidePreviousAttempts) {
		let attemptList = attempts.map((attempt, index) => {
			return (
				<li key={index}>
					<a href={`#attempt-${index + 1}`}
						onClick={() => setKeepPrevOpen(false)}
					>
						<span>Attempt {index + 1}: <span className="date">{attempt.date}</span></span>
						<span className="score">{attempt.roundedPercent}%</span>
					</a>
				</li>
			)
		}).reverse()
		
		priorAttempts = (
			<nav
				className={`previous-attempts ${prevAttemptOpen || keepPrevOpen ? 'open' : ''}`}
				onMouseOver={() =>!prevAttemptOpen && setprevAttemptOpen(true)}
				onMouseLeave={() => prevAttemptOpen && setprevAttemptOpen(false)}
			>
				<h1 onClick={() => setKeepPrevOpen(!keepPrevOpen)}>
					Prev. Attempts
				</h1>
				<ul>
					{attemptList}
				</ul>
			</nav>
		)
	}

	let playAgainBtn = null
	if (!attributes.hidePlayAgain && attemptsLeft > 0) {
		playAgainBtn = (
			<a id='play-again' className='action_button' href={attributes.href}>
				{isPreview ? 'Preview' : 'Play'} Again
				{attemptsLeft > 0 ? <span>({attemptsLeft} Left)</span> : <></>}
			</a>
		)
	}

	let scoreHeaderRender = null
	if (!errorState) {
		scoreHeaderRender = (
			<header className={`header score-header ${isPreview ? 'preview' : ''}`}>
				{priorAttempts}
				<h1 className='widget-title'>{attributes.title ? attributes.title : ''}</h1>
				{playAgainBtn}
			</header>
		)
	}

	let overviewRender = null
	if (!errorState && attributes.showScoresOverview && !!playData.overview) {
		overviewRender = <ScoreOverview
			inst_id={instID}
			single_id={null}
			overview={playData.overview}
			attemptNum={currentAttempt}
			isPreview={isPreview}
			guestAccess={instance?.guest_access} />
	}

	let customScoreScreenRender = null
	if (!errorState && customScoreScreen.show) {
		customScoreScreenRender = (
			<iframe ref={scoreWidgetRef}
				id='container'
				className={`html ${!playData.overview?.complete ? 'incomplete' : ''}`}
				src={customScoreScreen.htmlPath}>
			</iframe>
		)
	}

	let detailsRender = null
	if (!errorState && !playData.id) {
		detailsRender = (
			<section className={`overview ${isPreview ? 'preview' : ''}`}>
				<div className='loading-icon-holder'><LoadingIcon size='med' /></div>
			</section>
		)
	} else if (!errorState && attributes.showResultsTable) {
		detailsRender = <ScoreDetails details={playData?.details} complete={playData.overview?.complete} />
	}

	return (
		<article className={`container ${instanceIsLoading || scoresAreLoading ? 'loading' : 'ready'}`}>
			<div className='loading-icon-holder'><LoadingIcon size='med' /></div>
			{scoreHeaderRender}
			{overviewRender}
			{customScoreScreenRender}
			{detailsRender}
			{errorStateRender}
		</article>
	)
}

export default Scores