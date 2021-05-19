import React, { useState, useEffect, useCallback ,useRef } from 'react'
import MyWidgetScoreSemesterSummary from './my-widgets-score-semester-summary'
import LoadingIcon from './loading-icon'
import { useQuery } from 'react-query'
import { apiGetPlayLogs } from '../util/api'

const showScore = (instId, playId) => {
	window.open(`/scores/${instId}/#single-${playId}`)
}

const initState = () => {
	return({
		isLoading: true,
		searchText: '',
		selectedUser: {},
		logs: [],
		filteredLogs: []
	})
}

const MyWidgetScoreSemesterIndividual = ({semester, instId}) => {
	const [state, setState] = useState(initState())
	const { data: currLogs, isFetching: loadingLogs } = useQuery({
		queryKey: ['play-logs', instId],
		queryFn: () => apiGetPlayLogs(instId, semester.term, semester.year),
		enabled: !!instId && !!semester && !!semester.term && !!semester.year,
		staleTime: Infinity,
		placeholderData: []
	})
	const mounted = useRef(false)

	useEffect(() => {
    mounted.current = true
    return () => (mounted.current = false)
  }, [])

	// load instances after initial render
	useEffect(() => {
		if (mounted.current === true && !loadingLogs) {
			setState({...state, logs: currLogs, filteredLogs: currLogs, isLoading: false })
		}
	}, [loadingLogs])

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
			<div className={`display table ${state.isLoading === true ? 'loading' : ''}`}
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
