
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

const MyWidgetScoreSemesterIndividual = ({ semester, instId }) => {
	const [state, setState] = useState(initState())
	const [page, setPage] = useState(1)
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
	if (!state.isLoading) {
		const userRowElements = state.filteredLogs.map(user => (
			<tr
				key={user.userId}
				title={`View all scores for ${user.name}`}
				onClick={() => { setState({ ...state, selectedUser: user }) }}
				className={{ rowSelected: state.selectedUser.userId === user.userId }}
			>
				<td className={`listName ${state.selectedUser.userId === user.userId ? 'selected' : ''}`}>
					{user.name}
				</td>
			</tr>
		))

		let selectedUserRender = null
		if (state.selectedUser.userId != undefined) {
			const selectedUserScoreRows = state.selectedUser.scores.map(score => (
				<tr
					key={score.playId}
					title='View Detailed Scores for this Play'
					onClick={() => { showScore(instId, score.playId) }}
				>
					<td>{timestampToDateDisplay(score.created_at)}</td>
					<td>{score.score}</td>
					<td>{score.elapsed}</td>
				</tr>
			))

			selectedUserRender = (
				<div className='scoreTableContainer'>
					<table className='scoreTable'>
						<tbody>
							{selectedUserScoreRows}
						</tbody>
					</table>
				</div>
			)
		}

		else if (state.filteredLogs.length == 0) {
			selectedUserRender = <p className='no-user-search-results'>No users match that search.</p>
		}

		mainContentRender = (
			<>
				<div className='score-search'>
					<input type='text'
						value={state.searchText}
						onChange={(e) => setState({...state, searchText: e.target.value})}
						placeholder='Search Students'
					/>
				</div>

				<h3>Select a student to view their scores.</h3>
				<div className='scoreListContainer'>
					<div className='scoreListScrollContainer'>
						<table className='scoreListTable'>
							<tbody>
								{userRowElements}
							</tbody>
						</table>
					</div>
				</div>
				{selectedUserRender}
			</>
		)
	}

	return (
		<>
			<div className={`display table ${state.isLoading === true ? 'loading' : ''}`}
				id={`table_${semester.id}`} >
				{mainContentRender}
			</div>
			<MyWidgetScoreSemesterSummary {...semester} />
		</>
	)
}

export default MyWidgetScoreSemesterIndividual

