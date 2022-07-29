import React, { useState, useEffect, useRef} from 'react'
import { apiGetWidgetInstance, apiGetWidgetInstanceScores, apiGetGuestWidgetInstanceScores, apiGetScoreSummary, apiGetScoreDistribution, apiGetWidgetInstancePlayScores, apiGetQuestionSet } from '../util/api'
import { useQuery } from 'react-query'
import SupportInfo from './support-info'
import LoadingIcon from './loading-icon'
import '../materia/materia.scores.scoregraphics.js'

import './scores.scss'

const COMPARE_TEXT_CLOSE = 'Close Graph'
const COMPARE_TEXT_OPEN = 'Compare With Class'

const Scores = ({inst_id, play_id, single_id, send_token, isEmbedded, isPreview}) => {
	const [guestAccess, setGuestAccess] = useState(null)
	const [invalid, setInvalid] = useState(null)
	// attemptDates is an array of attempts, [0] is the newest
	const [attemptDates, setAttemptDates] = useState([])
	const [attempts, setAttempts] = useState([])
	// current attempt is the index of the attempt (the 1st attempt is attempts.length)
	const [currentAttempt, setCurrentAttempt] = useState(null)
	const [attempt, setAttempt] = useState(null)
	const [attemptsLeft, setAttemptsLeft] = useState(0)
	const [attemptNum, setAttemptNum] = useState(null)

	const [graphData, setGraphData] = useState([])
	const [details, setDetails] = useState([])
	const [overview, setOverview] = useState()
	const [prevAttemptClass, setPrevAttemptClass] = useState(null)

	const [restricted, setRestricted] = useState(null)
	const [expired, setExpired] = useState(null)
	const [showScoresOverview, setShowScoresOverview] = useState(true)
	const [showResultsTable, setShowResultsTable] = useState(true)
	const [toggleClassRankGraph, setToggleClassRankGraph] = useState(null)
	const graphRef = useRef(null)
	const [scoreTable, setScoreTable] = useState(null)
	const [classRankText, setClassRankText] = useState(COMPARE_TEXT_OPEN)
	const [graphShown, setGraphShown] = useState(null)

	const [playId, setPlayId] = useState(null)
	const [previewInstId, setPreviewInstId] = useState(null)

	const [customScoreScreen, setCustomScoreScreen] = useState({
		htmlPath: null,
		type: null,
		qset: null,
		scoreTable: null,
		show: false,
		loading: true
	})
	const [playAgainUrl, setPlayAgainUrl] = useState(null)
	const [hidePlayAgain, setHidePlayAgain] = useState(null)
	const scoreHeaderRef = useRef(null)
	const [hidePreviousAttempts, setHidePreviousAttempts] = useState(null)
	const [widget, setWidget] = useState(null)
	const scoreWidgetRef = useRef(null)

	// Gets widget instance
	const { isLoading: instanceIsLoading, data: instance } = useQuery({
		queryKey: ['widget-inst', inst_id],
		queryFn: () => apiGetWidgetInstance(inst_id),
		enabled: !!inst_id,
		staleTime: Infinity,
	})

	// Gets qset
	const { isLoading: qSetIsLoading, data: qset } = useQuery({
		queryKey: ['qset', inst_id],
		queryFn: () => apiGetQuestionSet(inst_id),
		staleTime: Infinity,
		placeholderData: null,
		onSettled: (data) => {
			if ( (data != null ? data.title : undefined) === 'Permission Denied' || data.type === 'error' ) setExpired(true)
		}
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
			console.log('result from getWidgetInstanceScores query')
			console.log(result)
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
			console.log('result from getWidgetInstanceScores query')
			console.log(result)
			if (result && result.type == 'error') setRestricted(true)
			else _populateScores(result)
		}
	})

	// Gets widget instance play scores when playId
	// or previewInstId are changed
	// playId and previewInstId are initialized in _getScoreDetails
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

	// Gets score summary
	const { isLoading: scoreSummaryIsLoading, data: scoreSummary, refetch: loadScoreSummary } = useQuery({
		queryKey: ['score-summary', inst_id],
		queryFn: () => apiGetScoreSummary(inst_id),
		staleTime: Infinity,
		enabled: !!inst_id
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

			// cleanup this listener
			return () => {
				window.removeEventListener('message', _onPostMessage, false);
			}
		}
	}, [
		customScoreScreen.loading,
		qset,
		instance,
	])

	// Initializes the custom score screen
	useEffect(() => {
		if (instance && qset) {
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
					qset: qset,
					scoreTable: scoreTable,
					type: 'html',
					loading: false,
					show: true
				})
			}
			_displayWidgetInstance()
		}
	}, [instance, qset, scoreTable])

	// _getInstanceScores
	// only for non-preview scores, guest or normal
	useEffect(() => {
		if (guestAccess !== null && !isPreview) {
			if (guestAccess) {
				loadGuestScores()
			} else {
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
				attempts.forEach((a, i) => {
					const d = new Date(a.created_at * 1000)

					// attemptDates is used to populate the overview data in displayWidgetInstance, it's just assembled here.
					let dates = {...attemptDates}
					let date = {...dates[i]}
					date = d.getMonth() + 1 + '/' + d.getDate() + '/' + d.getFullYear()
					dates[i] = date
					setAttemptDates(dates)

					if (play_id === a.id) {
						matchedAttempt = attempts.length - i
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
					window.location.hash = `#attempt-${attempts.length}`
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
		if (!!playId) loadPlayScores()
	}, [playId])

	useEffect(() => {

		if (playScores && playScores.length > 0) {
			
			// if (!customScoreScreen.show) {
			// }

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
				console.log('setting currentAttempt here')
				setAttemptNum(currentAttempt)
			}
			if (showResultsTable) {
				setTimeout(() => _addCircleToDetailTable(deets.details), 10)
			}

			const referrerUrl = deets.overview.referrer_url
			if ( deets.overview.auth === 'lti' && !!referrerUrl && referrerUrl.indexOf(`/scores/${inst_id}` ) === -1 ) {
				setPlayAgainUrl(referrerUrl)
			} else {
				setPlayAgainUrl(widget.href)
			}
			setScoreTable(deets.details[0].table)
		}
	}, [playScores])

	const listenToHashChange = () => {
		const hash = getAttemptNumberFromHash()
		if (currentAttempt != hash) setCurrentAttempt(hash)
		
		if (customScoreScreen.show) {
			// update the customScoreScreen
			_sendWidgetUpdate()
		}
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

	// only referenced once, after instance and qset are loaded
	const _displayWidgetInstance = () => {
		// Build the data for the overview section, prep for display through Underscore
		const widget = {
			title: instance.name,
			dates: attemptDates,
			href: null
		}

		// show play again button?
		if (!single_id && (instance.attempts <= 0 || parseInt(attemptsLeft) > 0 || isPreview)) {
			const prefix = (() => {
				if (isEmbedded && isPreview) return '/preview-embed/'
				if (isEmbedded) return '/embed/'
				if (isPreview) return '/preview/'
				return '/play/'
			})()

			widget.href = prefix + instance.id + '/' + instance.clean_name
			if (typeof window.LAUNCH_TOKEN !== 'undefined' && window.LAUNCH_TOKEN !== null) {
				widget.href += `?token=${window.LAUNCH_TOKEN}`
			}
			setAttemptsLeft(attemptsLeft)
		} else {
			// if there are no attempts left, hide play again
			setHidePlayAgain(true)
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

		widget.headerStyle = {
			'fontSize': textSize,
			'paddingTop': paddingSize,
		}

		setHidePreviousAttempts(single_id)
		setWidget(widget)
	}

	// Uses jPlot to create the bargraph
	const _toggleClassRankGraph = () => {
		// toggle button text
		if (graphShown) {
			setClassRankText(COMPARE_TEXT_OPEN)
			setGraphShown(false)
			graphRef.current.classList.remove('open')
		} else {
			setGraphShown(true)
			setClassRankText(COMPARE_TEXT_CLOSE)
			graphRef.current.classList.add('open')
		}

		// return if graph already built
		if (graphData.length > 0) {
			return
		}

		// return if preview
		if (isPreview) {
			return
		}

		// ========== BUILD THE GRAPH =============
		waitForScoreSummary().then(() => {
			// add up all semesters data into one dataset
			let _graphData = [
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

			for (let d of Array.from(scoreSummary)) {
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

			setGraphData(_graphData)
		})
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
							window.Materia.Scores.Scoregraphics.drawModifierCircle(canvas_id, index, percent, greyMode)
							break
						case 'final':
							window.Materia.Scores.Scoregraphics.drawFinalScoreCircle(canvas_id, index, percent)
							break
						case 'score':
							greyMode = table.score === -1
							window.Materia.Scores.Scoregraphics.drawScoreCircle(canvas_id, index, percent, greyMode)
							break
					}
				})
			}
		})
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
		if (customScoreScreen.qset == null || scoreWidgetRef.current == null) {
			// Custom score screen failed to load, load default overview instead
			setCustomScoreScreen({...customScoreScreen, loading: true, show: false})
			setShowResultsTable(true)
			setShowScoresOverview(true)
			setInvalid(true)
			return
		}
		_sendToWidget('initWidget', [customScoreScreen.qset, customScoreScreen.scoreTable, instance, isPreview, window.MEDIA_URL])
	}

	const _sendWidgetUpdate = () => {
		_sendToWidget('updateWidget', [qset, scoreTable])
	}

	const _setHeight = (h) => {
		const min_h = instance.widget.height
		let desiredHeight = Math.max(h, min_h)
		scoreWidgetRef.current.style.height = `${desiredHeight}px`
	}

	const waitForScoreSummary = async () => {
		while (scoreSummaryIsLoading || !scoreSummary) {
			await new Promise(resolve => setTimeout(resolve, 500))
		}
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
					<a href={`#attempt-${index + 1}`} onClick={attemptClick}>Attempt {index + 1}: <span className="score">{ attempt.roundedPercent}%</span><span className="date">{ attemptDates[index]}</span></a>
				</li>
			)
		})

		previousAttempts = (
			<nav className={`header-element previous-attempts ${prevAttemptClass}`} onMouseOver={() => setPrevAttemptClass('open')} onMouseOut={() => setPrevAttemptClass('')}>
				<h1 onClick={() => setPrevAttemptClass('open')}>Prev. Attempts</h1>
				<ul onMouseOver={() => setPrevAttemptClass('open')}>
					{attemptList}
				</ul>
			</nav>
		)
	}

	let playAgainBtn = null
	if (!hidePlayAgain) {
		playAgainBtn = (
			<nav className="play-again header-element">
				<h1>
					<a id="play-again" className="action_button" href={playAgainUrl}>
						{ isPreview ? 'Preview' : 'Play' } Again
						{ attemptsLeft > 0 ? <span>({ attemptsLeft } Left)</span> : <></>}
					</a>
				</h1>
			</nav>
		)
	}

	let scoreHeader = null
	if (!restricted && !expired) {
		scoreHeader = (
			<header className={`header score-header ${isPreview ? 'preview' : ''}`}>
				{ previousAttempts }
				<h1 className="header-element widget-title" ref={scoreHeaderRef} style={widget ? widget.headerStyle : {}}>{ widget ? widget.title : ''}</h1>
				{ playAgainBtn }
			</header>
		)
	}

	let overviewIncomplete = null
	if (overview && !overview.complete) {
		overviewIncomplete = (
			<div id='overview-incomplete'>
				<h2>Incomplete Attempt</h2>
				<hr/>
				<p>
					This student didn't complete this attempt.
					This score was not counted in any linked gradebooks and is only available for informational purposes.
				</p>
			</div>
		)
	}

	let classRankBtn = null
	if (!isPreview) {
		classRankBtn = (
			<div id="class-rank-button" className="action_button gray" onClick={_toggleClassRankGraph}>{classRankText}</div>
		)
	}

	let overviewRender = null
	if (!restricted && !expired && showScoresOverview && !!overview) {
		let overviewTable = []
		overview.table.forEach((row, index) => {
			overviewTable.push(
				<tr key={`${row}-${index}`}>
					<td>{row.message}</td>
					<td className={`${(row.value > -1) ? 'positive' : 'negative'} number`}>
						{row.value}{(row.symbol == null) ? '%' : row.symbol}
					</td>
				</tr>
			)
		})

		overviewRender = (
			<section className={`overview ${isPreview ? 'preview' : ''}`}>
				{ overviewIncomplete }
				<div id="overview-score">
					{ !guestAccess ?
						<h1>Attempt <span className="attempt-num">{ attemptNum }</span> Score:</h1>
					:
						<h1>This Attempt Score:</h1>
					}
					<span className="overall_score">{overview.score}<span className="percent">%</span></span>
					{ classRankBtn }
				</div>
				<div id="overview-table">
					<table>
						<tbody>
							{ overviewTable }
						</tbody>
					</table>
				</div>
			</section>
		)
	}

	let scoreGraphRender = null
	if (!restricted && !expired) {
		scoreGraphRender = (
			<section className="score-graph" ref={graphRef}>
				<div className="graph">
					<div id="graph">
					</div>
				</div>
			</section>
		)
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

	let detailsRender = []
	if (showResultsTable && !restricted && !expired) {
		 details.forEach((detail, i) => {
			 let detailsTableRows = []
			 let detailsHeaders = []
			 detail.table.forEach((row, index) => {
				 let detailsTableData = []
				 if (row.graphic != 'none') {
					 detailsTableData.push(
						 <td key={`${row}-${index}`} className="index">
							 <canvas className="question-number" id={`question-${i+1}-${index+1}`} >
								 <p>{ index+1 }</p>
							 </canvas>
							 {row.display_score &&
								 <span>
									 { row.score }{ row.symbol }
								 </span>
							 }
						 </td>
					 )
				 }

				 row.data.forEach((data, index) => {
					 detailsTableData.push(
						 <td key={`${data}-${index}`} className={row.data_style[index]}>{data}</td>
					 )
				 })

				 detailsTableRows.push(
					 <tr key={`${row}-${index+1}`} className={`${row.style} ${row.feedback != null ? 'has_feedback' : ''}`}>
						 { detailsTableData }
					 </tr>
				 )

				 if (row.feedback != null) {
					 detailsTableRows.push(
						 <tr key={`${row}-${index+2}`} className="feedback single_column">
							 <td colSpan={ row.data.length + 1 }>
								 <p>{ row.feedback }</p>
							 </td>
						 </tr>
					 )
				 }

			 })

			 detail.header.forEach((header, i) => {
				 detailsHeaders.push(
					 <th key={`${header}-${i}`}>{header}</th>
				 )
			 })
			 detailsRender.push(
				<section className="details" key={i}>
					<h1>{ detail.title }</h1>

					<table>
						<thead>
							<tr className="details_header">
								{ detailsHeaders }
							</tr>
						</thead>
						<tbody>
							{ detailsTableRows }
						</tbody>
					</table>
				</section>
			)
		})
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

					<SupportInfo/>
				</section>
			</div>
		)
	}

	return (
		<article className={`container ${ instanceIsLoading || qSetIsLoading || scoresAreLoading ? 'loading' : 'ready'}`}>
			<div className='loading-icon-holder'><LoadingIcon size='med' /></div>
			{ scoreHeader }
			{ overviewRender }
			{ scoreGraphRender }
			{ customScoreScreenRender }
			{ detailsRender }
			{ expiredRender }
			{ restrictedRender }
		</article>
	)
}

export default Scores
