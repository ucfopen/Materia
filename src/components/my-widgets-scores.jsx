import React, { useState, useEffect } from 'react'
import MyWidgetScoreSemester from './my-widgets-score-semester'
import MyWidgetsExport from './my-widgets-export'
import LoadingIcon from './loading-icon'
import './my-widgets-scores.scss'

const MyWidgetsScores = ({inst}) => {
	const [state, setState] = useState({
		scores: [],
		isShowingAll: false,
		isLoadingScores: true,
		hasScores: false,
		showExport: false
	})

	// Initializes the data when widget changes
	useEffect(() => {
		setState({...state, scores: [], isShowingAll: false,  isLoadingScores: true})
		// getScores
		const options = {
			"headers": {
			"cache-control": "no-cache",
			"pragma": "no-cache",
			"content-type": "application/x-www-form-urlencoded; charset=UTF-8"
			},
			"body": `data=%5B%22${inst.id}%22%2C${true}%5D`,
			"method": "POST",
			"mode": "cors",
			"credentials": "include"
		}

		fetch('/api/json/score_summary_get/', options)
		.then(resp => {
			if(resp.ok && resp.status !== 204 && resp.status !== 502) return resp.json()
			return []
		})
		.then(scores => {
			let _hasScores = false
			const ranges = [
				"0-9",
				"10-19",
				"20-29",
				"30-39",
				"40-49",
				"50-59",
				"60-69",
				"70-79",
				"80-89",
				"90-100",
			]
			scores.forEach(semester => {
				semester.graphData = semester.distribution?.map((d, i) => ({ label: ranges[i], value: d }) )
				semester.totalScores = semester.distribution?.reduce((total, count) => total+count)

				if (semester.distribution !== undefined) {
					_hasScores = true
				}
			})

			setState({
				scores,
				isShowingAll: scores.length < 2,
				isLoadingScores: false,
				hasScores: _hasScores,
				showExport: false
			})
		})
		.catch(error => {
			//console.log(error)
		})
	}, [inst.id])

	const openExport = () => {
		setState({...state, showExport: true})
		document.body.style.overflow = "hidden"
	}

	const closeExport = () => {
		setState({...state, showExport: false})
		document.body.style.overflow = "auto"
	}

	const displayedSemesters = state.isShowingAll
		? state.scores // all semester being displayed
		: state.scores.slice(0,1) // show just one semester, gracefully handles empty array

	return (
		<div className="scores">
			<h2>Student Activity</h2>
			<span
				id="export_scores_button"
				className={`aux_button ${state.scores.length ? '' : 'disabled'}`}
				onClick={openExport}
			>
				<span className="arrow_down"></span>
				Export Options
			</span>
			{state.isLoadingScores
				? <LoadingIcon />
				: <div>
					{
					displayedSemesters.map(semester => 
						<MyWidgetScoreSemester key={semester.id}
							semester={semester}
							instId={inst.id}
							hasScores={state.hasScores} />
					)}
					<a role="button"
						className={`show-older-scores-button ${state.scores.length > 1 ? '' : 'hide'}`}
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
				? <MyWidgetsExport onClose={closeExport} inst={inst} scores={state.scores}/>
				: null
			}
		</div>
	)
}

export default MyWidgetsScores
