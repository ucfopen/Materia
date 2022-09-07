import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery } from 'react-query'
import { apiGetPlayLogs, apiGetPlayLogsPaginate } from '../util/api'
import MyWidgetScoreSemesterSummary from './my-widgets-score-semester-summary'
import LoadingIcon from './loading-icon'

const showScore = (instId, playId) => window.open(`/scores/single/${playId}/${instId}`)

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
	const [logsList, setLogsList] = useState([])
	const {
		data,
		isFetching,
		refetch
	} = useQuery(
		['play-logs', instId, semester],
		() => apiGetPlayLogsPaginate(instId, semester.term, semester.year, page),
		{
			keepPreviousData: true,
			enabled: !!instId && !!semester && !!semester.term && !!semester.year,
			placeholderData: [],
			refetchOnWindowFocus: false,
		})

	// load instances after initial render
	useEffect(() => {
		if (!isFetching) {

			if (logsList.length == 0) { setLogsList(current => [...current, ...data?.pagination]) }
			else {


				let copyLogsList = logsList
				copyLogsList?.forEach(current => {

					for (let index = 0; index < data?.pagination?.length; index++) {
						let incomingLog = data.pagination[index]

						if (current.userId === incomingLog.userId) {
							console.log(`current.userId === incomingLog.userId: ${current.userId === incomingLog.userId}`)
							for (let scoreIndex = 0; scoreIndex < incomingLog.scores.length; scoreIndex++) {

								if (!current.scores.includes(incomingLog.scores[scoreIndex])) { current.scores.push(incomingLog.scores[scoreIndex]) }

							}

						}
						else {
							console.log(`current.userId === incomingLog.userId: ${current.userId === incomingLog.userId}`)
							console.log({ incomingLog })
							return incomingLog
						}
					}

				})// End of copyLogsList

				setLogsList(copyLogsList)
			} // end of else

			if (page <= data?.total_num_pages) { setPage(page + 1) }
			// triggers the final refetch for retrieving the final page.



		}
	}, [isFetching])

	useEffect(() => {
		setState({ ...state, logs: logsList, filteredLogs: logsList, isLoading: false })
	}, [logsList])

	useEffect(() => {
		if (page != data?.total_num_pages + 1) { refetch() }
	}, [page])


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
		if (!isSelectedInResults) {
			newState.selectedUser = {}
		}
		setState(newState)
	},
		[state.searchText, state.selectedUser, state.logs])

	const handleSearchChange = e => onSearchInput(e.target.value)

	let mainContentRender = <LoadingIcon width='570px' />
	if (!state.isLoading) {
		const userRowElements = state.filteredLogs.map(user => (
			<tr key={user.userId}
				className={{ rowSelected: state.selectedUser.userId === user.userId }}
				onClick={() => { setState({ ...state, selectedUser: user }) }}
				title={`View all scores for ${user.name}`}>
				<td className={`listName ${state.selectedUser.userId === user.userId ? 'selected' : ''}`}>
					{user.name}
				</td>
			</tr>
		))

		let selectedUserRender = null
		if (state.selectedUser.userId) {
			const selectedUserScoreRows = state.selectedUser.scores.map(score => (
				<tr key={score.playId}
					onClick={() => { showScore(instId, score.playId) }}
					title='View Detailed Scores for this Play'>
					<td>{score.date}</td>
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

		mainContentRender = (
			<>
				<div className='score-search'>
					<input type='text'
						value={state.searchText}
						onChange={handleSearchChange}
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
