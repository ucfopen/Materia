import React, { useState, useEffect, useRef } from 'react'
import { useQuery } from 'react-query'
import { apiGetStorageData } from '../util/api'
import LoadingIcon from './loading-icon'
import PaginateButtons from './score-storage-paginate-buttons'
import StorageRows from './score-storage-rows'

const initState = () => {
	return ({
		pageNumber: 0,
		startIndex: 0,
		endIndex: 10,
		rowsPerPage: 10,
		storageData: [],
		selectedValues: null,
		selectedTableName: null,
		anonymous: false,
		tableNames: [],
		pages: [1],
		tableKeys: [],
		isTruncated: false,
		isFiltered: false,
		isGuest: false,
		isLoading: true
	})
}

const MyWidgetScoreSemesterStorage = ({semester, instId}) => {
	const [state, setState] = useState(initState())
	const [searchInput, setSearchInput] = useState("")
	const mounted = useRef(false)
	const MAX_ROWS = 100
	const { data: results } = useQuery({
		queryKey: ['score-storage', instId],
		queryFn: () => apiGetStorageData(instId),
		enabled: !!instId,
		staleTime: Infinity,
		placeholderData: {}
	})

	useEffect(() => {
    mounted.current = true
    return () => (mounted.current = false)
  }, [])

	// Gets the storage data from db and loads it as well as filters based on search val
	useEffect(() => {
		if (results && Object.keys(results).length > 0) {
			const _tableNames = Object.keys(results)
			const _selectedTableName = state.selectedTableName !== null && _tableNames.includes(state.selectedTableName) ? state.selectedTableName : _tableNames[0]
			const _tableKeys = Object.keys(results[_selectedTableName][0].data)
			const tmpResults = results[_selectedTableName].length <= MAX_ROWS 
				?	results[_selectedTableName]
				: results[_selectedTableName].slice(0, MAX_ROWS)
			const filteredRes = tmpResults.filter(val => getFilter(val))
			const _selectedValues = filteredRes.slice(0, state.rowsPerPage)
			const _isTruncated = results[_selectedTableName].length > MAX_ROWS
			const pageLen = Math.min(filteredRes.length, state.rowsPerPage)
			const _pages = Array.from({length: Math.ceil(filteredRes.length/pageLen)}, (_, i) => i + 1)
			const _isFiltered = filteredRes.length < tmpResults.length

			if (mounted.current) {
				setState({
					...state,
					pageNumber: 0,
					startIndex: 0,
					endIndex: pageLen,
					storageData: filteredRes,
					tableNames: _tableNames,
					selectedValues: _selectedValues,
					selectedTableName: _selectedTableName,
					isTruncated: _isTruncated,
					isFiltered: _isFiltered,
					totalEntries: tmpResults.length,
					pages: _pages,
					tableKeys: _tableKeys,
					isLoading: false
				})
			}
		}
	}, [JSON.stringify(results), semester, instId, searchInput, state.selectedTableName])

	const onChangePageCount = (newValue) => {
		const numPages = Math.ceil(state.storageData?.length/newValue)
		const pagesArr = Array.from({length: numPages}, (_, i) => i + 1) // Generates list of ints 1 to numPages
		const startIndex = 0
		const endIndex = Math.min(state.storageData?.length, newValue)
		const _selectedValues = state.storageData?.slice(startIndex, endIndex)
		setState({...state,
			rowsPerPage: newValue,
			selectedValues: _selectedValues,
			startIndex: startIndex,
			endIndex: endIndex,
			pageNumber: 0,
			pages: pagesArr
		})
	}

	// Filter used in search
	const getFilter = (val) => {
		const firstLast = val.play.firstName + val.play.lastName
		const sanatizedSearch = searchInput.replace(/\s+/g, '').toUpperCase()

		if (searchInput.length === 0) return true

		// Matches by user
		if (val.play.user.replace(/\s+/g, '').toUpperCase().includes(sanatizedSearch))
			return true

		// Matches by first and last
		if (firstLast.replace(/\s+/g, '').toUpperCase().includes(sanatizedSearch))
			return true

		return false
	}

	return (
		<div className={`display data ${state.isLoading ? 'loading' : ''}`} >

			{!state.isLoading
				? <>
					<div>
						<label>
							<input
								className="anonymize-box"
								type='checkbox'
								checked={state.anonymous}
								onChange={e => {setState({...state, anonymous: e.target.checked})}}
							/>
							Anonymize Download
						</label>
						<a
							className="storage"
							href={`/data/export/${instId}?type=storage&table=${state.selectedTableName}&semesters=${semester.year}-${semester.term}&anonymized=${state.anonymous}`}
						>
							Download Table
						</a>
					</div>
					<div>
						<label className="table label">
							<h4>Table:
							{	state.tableNames.length > 1
								?	<select value={state.selectedTableName} onChange={e => {setState({...state, selectedTableName: e.target.value})}}>
										{state.tableNames.map(name => <option key={name} value={name} >{name}</option>)}
									</select>
								: Array.isArray(state.tableNames) ? <span>{state.tableNames[0]}</span> : ''
							}
							</h4>
						</label>

						{state.isTruncated
							?	<p className="truncated-table">
									Showing only the first { MAX_ROWS } entries of this table.
									Download the table to see all entries.
								</p>
							: null
						}

						<div className="dataTables_info_holder">
							<div className="dataTables_length">
								<label>
									Show
									<select value={state.rowsPerPage} onChange={e => {onChangePageCount(parseInt(e.target.value, 10))}}>
										<option value="10">10</option>
										<option value="25">25</option>
										<option value="50">50</option>
										<option value="100">100</option>
									</select>
									entries
								</label>
							</div>

							<div id="dataTables_filter" className="dataTables_filter">
								<label>Search:
									<input type="search"
										className=""
										placeholder=""
										aria-controls="DataTables_Table_0"
										value={searchInput}
										onChange={(e) => {setSearchInput(e.target.value)}}/>
								</label>
							</div>
						</div>
						<StorageRows isLoading={state.isLoading} selectedValues={state.selectedValues} tableKeys={state.tableKeys} />
						<PaginateButtons key='paginate-component' state={state} setState={setState} searchInput={searchInput}/>
					</div>
					</>
				: <div className="loading-holder">
						<LoadingIcon />
					</div>
			}
		</div>
	)
}

export default MyWidgetScoreSemesterStorage
