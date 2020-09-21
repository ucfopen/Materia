import React, { useState, useEffect, useMemo, useCallback } from 'react'
import MyWidgetScoreSemester from './my-widgets-score-semester'

const MyWidgetsScores = ({inst}) => {
	const [state, setState] = useState({
		scores: [],
		isShowingAll: false,
		isLoadingScores: true
	})

	useEffect(
		() => {
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
					if(resp.ok && resp.status !== 204) return resp.json()
					return []
				})
				.then(scores => {
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
						semester.graphData = semester.distribution.map((d, i) => ({ label: ranges[i], value: d }) )
						semester.totalScores = semester.distribution.reduce((total, count) => total+count)
					})

					setState({
						scores,
						isShowingAll: scores.length < 2,
						isLoadingScores: false
					})
				})
		}, [inst.id]
	)

	const displayedSemesters = state.isShowingAll
		? state.scores // all semester being displayed
		: state.scores.slice(0,1) // show just one semester, gracefully handles empty array

	return (
		<div className="scores">
			<h2>Student Activity</h2>
			<span
				id="export_scores_button"
				className={`action_button aux_button ${state.scores.length ? '' : 'disabled'}`}
			>
				<span className="arrow_down"></span>
				Export Options
			</span>
			{state.isLoadingScores
				? <div>Loading Score Data...</div>
				: <div>
					{displayedSemesters.map(semester => <MyWidgetScoreSemester key={semester.id} semester={semester} instId={inst.id} />)}
					{!state.isShowingAll
						?	<a role="button"
								className="show-older-scores-button"
								onClick={() => setState({...state, isShowingAll: true})}
							>

								Show older scores...
							</a>
						: null
					}
					</div>
			}


		</div>
	)
}

export default MyWidgetsScores
