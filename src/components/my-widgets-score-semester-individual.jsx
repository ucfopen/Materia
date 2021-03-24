import React, { useState, useEffect, useCallback ,useRef } from 'react'
import MyWidgetScoreSemesterSummary from './my-widgets-score-semester-summary'
import fetchOptions from '../util/fetch-options'
import LoadingIcon from './loading-icon'

const fetchPlayLogs = (instId, term, year) => fetch('/api/json/play_logs_get', fetchOptions({body: `data=%5B%22${instId}%22%2C%22${term}%22%2C%22${year}%22%5D`}))

const showScore = (instId, playId) => {
	window.open(`/scores/${instId}/#single-${playId}`)
}

const MyWidgetScoreSemesterIndividual = ({semester, instId}) => {
	const [state, setState] = useState({
		isLoading: true,
		searchText: '',
		selectedUser: {},
		logs: [],
		filteredLogs: []
	})
	const mounted = useRef(false)

	useEffect(() => {
    mounted.current = true
    return () => (mounted.current = false)
  }, [])

	// load instances after initial render
	useEffect(() => {
		fetchPlayLogs(instId, semester.term, semester.year)
		.then(resp => resp.json())
		.then(results => {
			// convert array of scores into scores grouped by user
			// creates a map keyed by user
			const timestampToDateDisplay = timestamp => {
				const d = new Date(parseInt(timestamp, 10) * 1000)
				return d.getMonth() + 1 + '/' + d.getDate() + '/' + d.getFullYear()
			}

			const scoresByUser = new Map()
			results.forEach(log => {
				let scoresForUser
				if(!scoresByUser.has(log.user_id)){
					// initialize user
					const name = log.first === null ? 'All Guests' : `${log.first} ${log.last}`
					scoresForUser = {
						userId: log.user_id,
						name,
						searchableName: name.toLowerCase(),
						scores: []
					}
					scoresByUser.set(log.user_id, scoresForUser)
				} else{
					// already initialized
					scoresForUser = scoresByUser.get(log.user_id)
				}

				// append to scores
				scoresForUser.scores.push({
					elapsed: parseInt(log.elapsed, 10) + 's',
					playId: log.id,
					score: log.done === "1" ? Math.round(parseFloat(log.perc)) + '%' : "---",
					date: timestampToDateDisplay(log.time)
				})
			})

			// convert to array of values and update display

			if (mounted.current === true) {
				const logs = Array.from(scoresByUser, ([name, value]) => value)
				setState({...state, logs: logs, filteredLogs: logs, isLoading: false })
			}
		})
	}, [])

	const onSearchInput = useCallback(search => {
		search = search.toLowerCase()
		const filteredLogs = state.logs.filter(item => item.searchableName.includes(search))

		const newState = {
			...state,
			filteredLogs: filteredLogs,
			searchText: search
		}

		// unselect user if not in filtered results
		const isSelectedInResults = filteredLogs.includes(state.selectedUser)
		if(!isSelectedInResults){
			newState.selectedUser = {}
		}
		setState(newState)
	},
	[state.searchText, state.selectedUser, state.logs])

	return (
		<React.Fragment>
			<div className={`display table ${state.isLoading == true ? 'loading' : ''}`}
				id={`table_${semester.id}`} >
				{state.isLoading
				? <LoadingIcon />
				: <React.Fragment>
						<div className="score-search">
							<input
								type="text"
								value={state.searchText}
								onChange={(e) => {onSearchInput(e.target.value)}}
								placeholder="Search Students" />
						</div>

						<h3>Select a student to view their scores.</h3>
						<div className="scoreListContainer">
							<div className="scoreListScrollContainer">
								<table className="scoreListTable">
									<tbody>
										{
											state.filteredLogs.map(user =>
												<tr
													key={user.userId}
													className={{rowSelected: state.selectedUser.userId === user.userId}}
													onClick={() => {setState({...state, selectedUser: user})}}
													title={`View all scores for ${user.name}`}
												>
													<td className={`listName ${state.selectedUser.userId === user.userId ? 'selected' : ''}`}>
														{user.name}
													</td>
												</tr>
											)
										}
									</tbody>
								</table>
							</div>
						</div>

						{state.selectedUser.userId
							? <div className="scoreTableContainer">
									<table className="scoreTable">
										<tbody>
											{
												state.selectedUser.scores.map(score =>
													<tr
														key={score.playId}
														onClick={() => {showScore(instId, score.playId)}}
														title="View Detailed Scores for this Play"
													>
														<td>{score.date}</td>
														<td>{score.score}</td>
														<td>{ score.elapsed }</td>
													</tr>
												)
											}
										</tbody>
									</table>
								</div>
							: null
						}

					</React.Fragment>
				}
			</div>
			<MyWidgetScoreSemesterSummary {...semester} />
		</React.Fragment>
	)
}

export default MyWidgetScoreSemesterIndividual
