import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from 'react-query'
import { apiGetScoreSummary } from '../util/api'
import MyWidgetScoreSemester from './my-widgets-score-semester'
import MyWidgetsExport from './my-widgets-export'
import LoadingIcon from './loading-icon'
import NoScoreContent from'./no-score-content'
import './my-widgets-scores.scss'

const MyWidgetsScores = ({inst, beardMode, setInvalidLogin}) => {
	const [state, setState] = useState({
		isShowingAll: false,
		hasScores: false,
		showExport: false
	})
	const [error, setError] = useState('')
	const { data: currScores, isFetched } = useQuery({
		queryKey: ['score-summary', inst.id],
		queryFn: () => apiGetScoreSummary(inst.id),
		enabled: !!inst && !!inst.id,
		staleTime: Infinity,
		placeholderData: [],
		retry: false,
		onError: (err) => {
			if (err.message == "Invalid Login") {
				setInvalidLogin(true);
			} else {
				setError((err.message || "Error") + ": Failed to retrieve scores.")
			}
		}
	})

	// Initializes the data when widget changes
	useEffect(() => {
		let hasScores = false
		if (currScores) {
			currScores.map(val => {
				if (val.distribution) hasScores = true
			})

			setState({
				hasScores: hasScores,
				showExport: false
			})
		}
	}, [JSON.stringify(currScores)])

	const displayedSemesters = useMemo(() => {
		if (currScores && (state.isShowingAll || currScores.length < 2)) return currScores // all semester being displayed
		else if (currScores) return currScores.slice(0,1) // show just one semester, gracefully handles empty array
		else return [] // no scores yet
	}, [currScores, state.isShowingAll])

	const openExport = () => {
		if (!inst.is_draft) setState({...state, showExport: true})
	}
	const closeExport = () => {
		setState({...state, showExport: false})
	}

	const containsStorage = () => {
		let hasStorageData = false
		for(const semester of displayedSemesters) {
			if (semester.storage) {
				hasStorageData = true
			}
		}

		return hasStorageData
	}

	const handleShowOlderClick = () => setState({...state, isShowingAll: !state.isShowingAll})

	let contentRender = <LoadingIcon />
	if (error) {
		contentRender = <div className='error'>{error}</div>
	}
	else if (isFetched) {
		contentRender = <NoScoreContent scorable={inst.widget.is_scorable} isDraft={inst.is_draft} beardMode={beardMode} />
		if (state.hasScores || containsStorage()) {
			const semesterElements = displayedSemesters.map(semester => (
				<MyWidgetScoreSemester key={semester.id}
					semester={semester}
					instId={inst.id}
					hasScores={state.hasScores}
					setInvalidLogin={setInvalidLogin}
				/>
			))

			contentRender = (
				<div>
					{ semesterElements }
					<a role='button'
						className={`show-older-scores-button ${currScores?.length > 1 ? '' : 'hide'}`}
						onClick={handleShowOlderClick}>
						{ state.isShowingAll ? 'Hide' : 'Show' } older scores...
					</a>
				</div>
			)
		}
	}

	let exportRender = null
	if (state.showExport) {
		exportRender = (
			<MyWidgetsExport onClose={closeExport}
				inst={inst}
				scores={currScores}
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
