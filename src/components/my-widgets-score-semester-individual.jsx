
import React, { useState, useEffect, useCallback, useRef, useId } from 'react'
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
	const studentScoresHeaderId = useId()

	if (error) {
		mainContentRender = <div className='error'>{error}</div>
	}
	else if (!state.isLoading) {
		const studentSearch = (
			<>
				<div className='search-icon'>
					<svg viewBox='0 0 250.313 250.313'>
						<path d='m244.19 214.6l-54.379-54.378c-0.289-0.289-0.628-0.491-0.93-0.76 10.7-16.231 16.945-35.66 16.945-56.554 0-56.837-46.075-102.91-102.91-102.91s-102.91 46.075-102.91 102.91c0 56.835 46.074 102.91 102.91 102.91 20.895 0 40.323-6.245 56.554-16.945 0.269 0.301 0.47 0.64 0.759 0.929l54.38 54.38c8.169 8.168 21.413 8.168 29.583 0 8.168-8.169 8.168-21.413 0-29.582zm-141.28-44.458c-37.134 0-67.236-30.102-67.236-67.235 0-37.134 30.103-67.236 67.236-67.236 37.132 0 67.235 30.103 67.235 67.236s-30.103 67.235-67.235 67.235z'
							clipRule='evenodd'
							fillRule='evenodd'/>
					</svg>
				</div>
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
					<li key={user.userId}>
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
				{state.selectedUser.userId == undefined && (
					<h3 className="centeredText">Select a student to view their scores.</h3>
				)}

				{/* User selected, display score table */}
				{state.selectedUser.userId != undefined && (
					<>
						<h3 id={studentScoresHeaderId}>{`${state.selectedUser.name}'s scores`}</h3>
						<table aria-labelledby={studentScoresHeaderId}>
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

