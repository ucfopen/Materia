import React, { useState, useEffect } from 'react'
import MyWidgetScoreSemester from './my-widgets-score-semester'
import MyWidgetsExport from './my-widgets-export'
import LoadingIcon from './loading-icon'
import { useQuery } from 'react-query'
import { apiGetScoreSummary } from '../util/api'
import './my-widgets-scores.scss'

const MyWidgetsScores = ({inst}) => {
	const [state, setState] = useState({
		isShowingAll: false,
		hasScores: false,
		showExport: false
	})
	const { data: currScores, isLoading } = useQuery({
		queryKey: ['score-summary', inst.id],
		queryFn: () => apiGetScoreSummary(inst.id),
		enabled: !!inst && !!inst.id,
		staleTime: Infinity,
		placeholderData: []
	})

	// Initializes the data when widget changes
	useEffect(() => {
		let _hasScores = false

		currScores.map((val) => {
			if (val.distribution) _hasScores = true
		})

		setState({
			hasScores: _hasScores,
			showExport: false
		})
	}, [JSON.stringify(currScores)])

	useEffect(() => {
		document.body.style.overflow = state.showExport ? 'hidden' : 'auto'
	}, [state.showExport]) 
	
	const openExport = () => {
		setState({...state, showExport: true})
	}
	const closeExport = () => {
		setState({...state, showExport: false})
	}

	const displayedSemesters = currScores && (state.isShowingAll || currScores.length < 2)
		? currScores // all semester being displayed
		: currScores.slice(0,1) // show just one semester, gracefully handles empty array

	return (
		<div className="scores">
			<h2>Student Activity</h2>
			<span
				id="export_scores_button"
				className={`aux_button ${currScores?.length ? '' : 'disabled'}`}
				onClick={openExport}
			>
				<span className="arrow_down"></span>
				Export Options
			</span>
			{isLoading
				? <LoadingIcon />
				: <div>
					{
					displayedSemesters.map(semester => 
						<MyWidgetScoreSemester 
							key={semester.id}
							semester={semester}
							instId={inst.id}
							hasScores={state.hasScores} />
					)}
					<a role="button"
						className={`show-older-scores-button ${currScores?.length > 1 ? '' : 'hide'}`}
						onClick={() => setState({...state, isShowingAll: !state.isShowingAll})}
					>
						{!state.isShowingAll
							? "Show older scores..."
							: "Hide older scores..."
						}
					</a>
					</div>
			}
			{state.showExport
				? <MyWidgetsExport onClose={closeExport} inst={inst} scores={currScores}/>
				: null
			}
		</div>
	)
}

export default MyWidgetsScores
