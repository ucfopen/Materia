import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from 'react-query'
import { apiGetScoreSummary } from '../util/api'
import MyWidgetScoreSemester from './my-widgets-score-semester'
import MyWidgetsExport from './my-widgets-export'
import LoadingIcon from './loading-icon'
import NoContentIcon from'./no-content-icon'
import './my-widgets-scores.scss'

const MyWidgetsScores = ({inst}) => {
	const [state, setState] = useState({
		isShowingAll: false,
		hasScores: false,
		showExport: false
	})
	const { data: currScores, isFetched } = useQuery({
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

	const displayedSemesters = useMemo(() => {
		if (currScores && (state.isShowingAll || currScores.length < 2)) return currScores // all semester being displayed
		return currScores.slice(0,1) // show just one semester, gracefully handles empty array
	}, [currScores, state.isShowingAll])

	const openExport = () => {
		if (containsData()) setState({...state, showExport: true})
	}
	const closeExport = () => {
		setState({...state, showExport: false})
	}

	const containsData = () => {
		let hasGraphData = false
		for(const val of currScores) {
			if (val.graphData) {
				hasGraphData = true
			}
		}

		return hasGraphData
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

	return (
		<div className="scores">
			<h2>Student Activity</h2>
			<span
				id="export_scores_button"
				className={`aux_button ${containsData() ? '' : 'disabled'}`}
				onClick={openExport}
			>
				<span className="arrow_down"></span>
				Export Options
			</span>
			{!isFetched
				? <LoadingIcon />
				:
					<>
						{
							state.hasScores || containsStorage()
							? <div>
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
							: <NoContentIcon />
						}
					</>
			}
			{state.showExport
				? <MyWidgetsExport onClose={closeExport} inst={inst} scores={currScores}/>
				: null
			}
		</div>
	)
}

export default MyWidgetsScores
