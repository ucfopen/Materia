import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGetScoreSummary } from '../util/api'
import MyWidgetScoreSemester from './my-widgets-score-semester'
import MyWidgetsExport from './my-widgets-export'
import LoadingIcon from './loading-icon'
import NoScoreContent from './no-score-content'
import './my-widgets-scores.scss'

const MyWidgetsScores = ({inst, contexts, beardMode, setInvalidLogin}) => {

	const visibilityAnchor = useRef(null)
	const shouldScroll = useRef(false)

	const [state, setState] = useState({
		loadedSemesters: [],
		nextSemesterToLoad: -1,
		hasScores: false,
		showExport: false
	})
	const [error, setError] = useState('')

	// memoize lastLoadedSemester for use as a query key
	const lastLoadedSemester = useMemo(() => {

		if (!state.loadedSemesters || !state.loadedSemesters.length) return -1
		else return state.loadedSemesters[state.loadedSemesters.length -1].id

	}, [state.loadedSemesters])

	const { data: currScores, isFetching, error: currScoresError, refetch: getMoreScoreSummaries } = useQuery({
		queryKey: ['score-summary', inst.id, lastLoadedSemester],
		queryFn: () => {
			if (state.nextSemesterToLoad == -1) return apiGetScoreSummary(inst.id, true)
			else return apiGetScoreSummary(inst.id, false, state.nextSemesterToLoad)
		},
		enabled: !!inst && !!inst.id && lastLoadedSemester == -1,
		staleTime: Infinity,
		placeholderData: [],
		retry: false,
	})

	useEffect(() => {
		if (!currScoresError) return
		switch (currScoresError.status) {
			case 401:
				setInvalidLogin(true)
				break
			default:
				setError((currScoresError) + ": Failed to retrieve scores.")
		}
	}, [currScoresError])

	// reset loaded semester data when the selected instance changes
	useEffect(() => {
		setState(state => ({...state, loadedSemesters: [], nextSemesterToLoad: -1, hasScores: false, showExport: false}))
		shouldScroll.current = false
	},[inst.id])

	// update score display when new semester data is loaded
	useEffect(() => {
		let hasScores = false
		const prevLoadedSemesterIds = state.loadedSemesters.map(term => term.id)
		const prevLoadedSemesters = [ ...state.loadedSemesters ]

		if (currScores && currScores.length > 0) {
			currScores.forEach(semester => {
				if (semester.distribution) hasScores = true
				if (!prevLoadedSemesterIds.includes(semester.id)) prevLoadedSemesters.push(semester)
			})

			setState({
				hasScores: hasScores,
				showExport: false,
				loadedSemesters: [...prevLoadedSemesters],
				nextSemesterToLoad: currScores[currScores.length - 1].preceding_semester_id
			})
		}

	}, [JSON.stringify(currScores)])

	// enable scrolling to new semester element when appropriate
	useEffect(() => {
		if (state.loadedSemesters.length > 1 && shouldScroll.current) {
			visibilityAnchor.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
			shouldScroll.current = false
		}
	}, [state.loadedSemesters])

	const openExport = () => {
		if (!inst.is_draft) setState({...state, showExport: true})
	}
	const closeExport = () => {
		setState({...state, showExport: false})
	}

	const containsStorage = () => {
		let hasStorageData = false
		for(const semester of state.loadedSemesters) {
			if (semester.storage) {
				hasStorageData = true
			}
		}

		return hasStorageData
	}

	const handleShowOlderClick = () => {
		getMoreScoreSummaries()
		if (state.nextSemesterToLoad != -1) shouldScroll.current = true
	}

	let contentRender = <LoadingIcon />
	if (error) {
		contentRender = <div className='error'>{error}</div>
	}
	else if (!isFetching) {
		contentRender = <NoScoreContent scorable={inst.widget.is_scorable} isDraft={inst.is_draft} beardMode={beardMode} />
		if (state.hasScores || containsStorage()) {
			const semesterElements = state.loadedSemesters.map(semester => (
				<MyWidgetScoreSemester key={semester.id}
					semester={semester}
					instId={inst.id}
					hasScores={state.hasScores}
					contexts={contexts}
					setInvalidLogin={setInvalidLogin}
				/>
			))

			contentRender = (
				<div>
					{ semesterElements }
					<a role='button'
						className={`show-older-scores-button ${state.nextSemesterToLoad != -1  ? '' : 'hide'}`}
						onClick={handleShowOlderClick}>
						{ state.nextSemesterToLoad == -1 ? 'Hide' : 'Show' } older scores...
					</a>
					<div id='visibility-anchor' ref={visibilityAnchor}></div>
				</div>
			)
		}
	}

	let exportRender = null
	if (state.showExport) {
		exportRender = (
			<MyWidgetsExport onClose={closeExport}
				inst={inst}
			/>
		)
	}

	return (
		<div className='scores'>
			<header className='student-activity-header'>
				<h2>Student Activity</h2>
				<span
					className={`action_button ${inst.is_draft ? 'disabled' : ''}`}
					onClick={openExport}>
					<span className='arrow_down'></span>
					Export Options
				</span>
			</header>
			{ contentRender }
			{ exportRender }
		</div>
	)
}

export default MyWidgetsScores
