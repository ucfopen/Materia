
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useQueryClient, useQuery } from 'react-query'
import { apiGetPlayLogs } from '../util/api'
import MyWidgetScoreSemesterSummary from './my-widgets-score-semester-summary'
import useDebounce from './hooks/useDebounce'
import LoadingIcon from './loading-icon'

const showScore = (instId, playId) => window.open(`/scores/single/${playId}/${instId}`)
const _compareScores = (a, b) => { return (parseInt(b.created_at) - parseInt(a.created_at)) }

const timestampToDateDisplay = timestamp => {
	const d = new Date(parseInt(timestamp, 10) * 1000)
	return d.getMonth() + 1 + '/' + d.getDate() + '/' + d.getFullYear()
}

const initState = () => ({
	isLoading: true,
	searchText: '',
	selectedUser: {},
	logs: [],
	filteredLogs: []
})

const MyWidgetScoreSemesterIndividual = ({ semester, instId, setInvalidLogin }) => {
	const [state, setState] = useState(initState())
	const [page, setPage] = useState(1)
	const [error, setError] = useState('')
	const debouncedSearchTerm = useDebounce(state.searchText, 250)
	const {
		data,
		refetch
	} = useQuery(
		['play-logs', instId, semester],
		() => apiGetPlayLogs(instId, semester.term, semester.year, page),
		{
			keepPreviousData: true,
			enabled: !!instId && !!semester && !!semester.term && !!semester.year,
			placeholderData: [],
			refetchOnWindowFocus: false,
			retry: false,
			onSuccess: (result) => {
				if (page <= result?.total_num_pages) setPage(page + 1)
				if (result && result.pagination) {
					let newLogs = state.logs

					result.pagination.forEach((record) => {
						if (newLogs[record.userId]) newLogs[record.userId].scores.push(...record.scores)
						else newLogs[record.userId] = { userId: record.userId, name: record.name, searchableName: record.searchableName, scores: record.scores }
						newLogs[record.userId].scores.sort(_compareScores)
					})

					setState({ ...state, logs: newLogs, filteredLogs: newLogs })
				}
			},
			onError: (err) => {
				if (err.message == "Invalid Login") {
					setInvalidLogin(true);
				} else {
					setError((err.message || "Error") + ": Failed to retrieve individual scores.")
				}
				setState({ ...state, isLoading: false })
			}
		}
	)

	useEffect(() => {
		if (page < data?.total_num_pages) { refetch() }
		else setState({ ...state, isLoading: false })
	}, [page])

	useEffect(() => {
		if (typeof debouncedSearchTerm === 'string') onSearchInput(debouncedSearchTerm)
	}, [debouncedSearchTerm])

	const onSearchInput = useCallback(search => {
		search = search.toLowerCase()
		const filteredLogs = state.logs.filter(item => item.searchableName.includes(search))

		let newState = {
			...state,
			filteredLogs: filteredLogs,
			searchText: search
		}

		// unselect user if not in filtered results
		const isSelectedInResults = filteredLogs.includes(state.selectedUser)
		if (!isSelectedInResults) {
			newState = {
				...newState,
				selectedUser: {}
			}
		}
		setState(newState)

	}, [state.searchText, state.selectedUser, state.logs])

	let mainContentRender = <LoadingIcon width='570px' />
	if (error) {
		mainContentRender = <div className='error'>{error}</div>
	}
	else if (!state.isLoading) {
		const studentSearch = (
			<>
				<input
					type='text'
					value={state.searchText}
					onChange={(e) => setState({...state, searchText: e.target.value})}
					placeholder='Search Students'
				/>
				{state.filteredLogs.length === 0 && (
					<h3 style={{ paddingTop: '5px' }}>No users match that search.</h3>
				)}
			</>
		)

		const studentList = (
			<ul aria-label="Students">
				{state.filteredLogs.map(user => (
					<li key={user.id}>
						<button
							className={state.selectedUser.userId === user.userId ? 'buttonSelected' : ''}
							onClick={() => {
								setState({...state, selectedUser: user})
							}}
						>
							{user.name}
						</button>
					</li>
				))}
			</ul>
		)

		const selectedStudentScores = (
			<>
				{/* No user selected */}
				{!state.selectedUser.userId && (
					<h3 className="centeredText">Select a student to view their scores.</h3>
				)}

				{/* User selected, display score table */}
				{state.selectedUser.userId && (
					<>
						<h3>{`${state.selectedUser.name}'s scores`}</h3>
						<table>
							<tbody>
							<tr>
								<th>Date</th>
								<th>Score</th>
								<th>Duration</th>
								<th aria-label="View Details Button"></th>
							</tr>
							{state.selectedUser.scores.map(score => (
								<tr key={score.playId}>
									<td>{timestampToDateDisplay(score.created_at)}</td>
									<td>{score.score}</td>
									<td>{score.elapsed}</td>
									<td>
										<button
											onClick={() => showScore(instId, score.playId)}
											title="View Detailed Scores for this Play"
										>
											<img src="/img/arrow_right_with_stem.svg" />
										</button>
									</td>
								</tr>
							))}
							</tbody>
						</table>
					</>
				)}
			</>
		)

		mainContentRender = (
			<>
				<div className='scoreListContainer'>
					{/* List of students */}
					<div className='scoreListStudentSelector'>
						{studentSearch}
						{studentList}
					</div>

					{/* Selected student scores */}
					<div className='scoreListStudentScoreTable'>
						{selectedStudentScores}
					</div>
				</div>
			</>
		)
	}

	return (
		<>
			<div className={`display table ${state.isLoading === true ? 'loading' : ''}`}
					 id={`table_${semester.id}`}>
				{mainContentRender}
			</div>
			<MyWidgetScoreSemesterSummary {...semester} />
		</>
	)
}

export default MyWidgetScoreSemesterIndividual

