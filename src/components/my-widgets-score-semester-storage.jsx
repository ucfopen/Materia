import React, { useState, useEffect, useRef } from 'react'
import { useQuery } from 'react-query'
import { apiGetStorageData } from '../util/api'
import LoadingIcon from './loading-icon'
import PaginateButtons from './score-storage-paginate-buttons'
import StorageRows from './score-storage-rows'

const initState = () => ({
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

const MAX_ROWS = 100

const MyWidgetScoreSemesterStorage = ({semester, instId}) => {
	const [state, setState] = useState(initState())
	const [searchInput, setSearchInput] = useState('')
	const mounted = useRef(false)
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
			const tableNames = Object.keys(results)
			const selectedTableName = state.selectedTableName !== null && tableNames.includes(state.selectedTableName) ? state.selectedTableName : tableNames[0]
			const selectedTable = results[selectedTableName]
			const tableKeys = Object.keys(selectedTable[0].data)
			const tmpResults = selectedTable.length <= MAX_ROWS ? selectedTable : selectedTable.slice(0, MAX_ROWS)
			const filteredRes = tmpResults.filter(val => getFilter(val))
			const selectedValues = filteredRes.slice(0, state.rowsPerPage)
			const isTruncated = selectedTable.length > MAX_ROWS
			const pageLen = Math.min(filteredRes.length, state.rowsPerPage)
			const pages = Array.from({length: Math.ceil(filteredRes.length/pageLen)}, (_, i) => i + 1)
			const isFiltered = filteredRes.length < tmpResults.length

			if (mounted.current) {
				setState({
					...state,
					pageNumber: 0,
					startIndex: 0,
					endIndex: pageLen,
					storageData: filteredRes,
					tableNames: tableNames,
					selectedValues: selectedValues,
					selectedTableName: selectedTableName,
					isTruncated: isTruncated,
					isFiltered: isFiltered,
					totalEntries: tmpResults.length,
					pages: pages,
					tableKeys: tableKeys,
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
		const selectedValues = state.storageData?.slice(startIndex, endIndex)
		setState({...state,
			rowsPerPage: newValue,
			selectedValues: selectedValues,
			startIndex: startIndex,
			endIndex: endIndex,
			pageNumber: 0,
			pages: pagesArr
		})
	}

	// Filter used in search
	const getFilter = (val) => {
		const firstLast = val.play.firstName + val.play.lastName
		const sanitizedSearch = searchInput.replace(/\s+/g, '').toUpperCase()

		if (searchInput.length === 0) return true

		// Matches by user
		if (val.play.user.replace(/\s+/g, '').toUpperCase().includes(sanitizedSearch))
			return true

		// Matches by first and last
		if (firstLast.replace(/\s+/g, '').toUpperCase().includes(sanitizedSearch))
			return true

		return false
	}

	const handleAnonymizeChange = e => setState({...state, anonymous: e.target.checked})

	const handlePerPageChange = e => onChangePageCount(parseInt(e.target.value, 10))

	const handleSearchChange = e => setSearchInput(e.target.value)

	let contentRender = (
		<div className='loading-holder'>
			<LoadingIcon />
		</div>
	)
	if (!state.isLoading) {
		let tableNamesRender = ''
		if (state.tableNames.length > 1) {
			const tableNamesOptionElements = state.tableNames.map(name => (
				<option key={name} value={name}>
					{name}
				</option>
			))

			tableNamesRender = (
				<select value={state.selectedTableName} onChange={e => {setState({...state, selectedTableName: e.target.value})}}>
					{ tableNamesOptionElements }
				</select>
			)
		} else if (Array.isArray(state.tableNames)) {
			tableNamesRender = (
				<span>{state.tableNames[0]}</span>
			)
		}

		let truncatedTableRender = null
		if (state.isTruncated) {
			truncatedTableRender = (
				<p className='truncated-table'>
					Showing only the first { MAX_ROWS } entries of this table.
					Download the table to see all entries.
				</p>
			)
		}

		// This URL string is otherwise huge and nasty, so it's built in multiple steps for readability.
		const downloadUrlBase = `/data/export/${instId}?type=storage`
		const tableValue = `table=${encodeURIComponent(state.selectedTableName)}`
		const semestersValue = `semesters=${semester.year}-${semester.term}`
		const downloadUrlString = `${downloadUrlBase}&${tableValue}&${semestersValue}&anonymized=${state.anonymous}`

		contentRender = (
			<>
				<div>
					<label>
						<input className='anonymize-box'
							type='checkbox'
							checked={state.anonymous}
							onChange={handleAnonymizeChange}
						/>
						Anonymize Download
					</label>
					<a className='storage'
						href={downloadUrlString}>
						Download Table
					</a>
				</div>
				<div>
					<label className='table label'>
						<h4>Table: { tableNamesRender }</h4>
					</label>

					{ truncatedTableRender }
					<div className='dataTables_info_holder'>
						<div className='dataTables_length'>
							<label>
								Show
								<select value={state.rowsPerPage} onChange={handlePerPageChange}>
									<option value='10'>10</option>
									<option value='25'>25</option>
									<option value='50'>50</option>
									<option value='100'>100</option>
								</select>
								entries
							</label>
						</div>

						<div id='dataTables_filter'
							className='dataTables_filter'>
							<label>Search:
								<input type='search'
									className=''
									placeholder=''
									aria-controls='DataTables_Table_0'
									value={searchInput}
									onChange={handleSearchChange}
								/>
							</label>
						</div>
					</div>
					<StorageRows isLoading={state.isLoading}
						selectedValues={state.selectedValues}
						tableKeys={state.tableKeys}
					/>
					<PaginateButtons key='paginate-component'
						state={state}
						setState={setState}
						searchInput={searchInput}
					/>
				</div>
			</>
		)
	}

	return (
		<div className={`display data ${state.isLoading ? 'loading' : ''}`} >
			{ contentRender }
		</div>
	)
}

export default MyWidgetScoreSemesterStorage
