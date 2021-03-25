import React, { useState, useEffect, useRef, useCallback } from 'react'
import fetchOptions from '../util/fetch-options'
import LoadingIcon from './loading-icon'

const fetchStorageData = (instId) => fetch('/api/json/play_storage_get', fetchOptions({body:`data=%5B%22${instId}%22%5D`}))

const defaultState = {
	pageNumber: 0,
	startIndex: 0,
	endIndex: 10,
	rowsPerPage: 10,
	storageData: [],
	selectedTable: null,
	selectedTableName: null,
	anonymous: false,
	tableNames: [],
	pages: [1],
	tableKeys: [],
	isTruncated: false,
	isGuest: false,
	isLoading: true,
	footerText: ""
}

const MyWidgetScoreSemesterStorage = ({semester, instId}) => {
	const [state, setState] = useState(defaultState)
	const [paginateBtns, setPageinateBtns] = useState([])
	const [searchInput, setSearchInput] = useState("")
	const [rowVals, setRowVals] = useState([])
	const mounted = useRef(false)
	const MAX_ROWS = 100

	useEffect(() => {
    mounted.current = true
    return () => (mounted.current = false)
  }, [])

	useEffect(() => {
		getPaginateBtns()
	}, [state, searchInput])

	// Gets the storage data from db and loads it
	useEffect(() => {
		fetchStorageData(instId)
		.then(resp => resp.json())
		.then(results => {
			const _tableNames = Object.keys(results)
			const _selectedTableName = _tableNames[0]
			const _tableKeys = Object.keys(results[_selectedTableName][0].data)
			const tmpResults = results[_selectedTableName].length <= MAX_ROWS 
				?	results[_selectedTableName]
				: results[_selectedTableName].slice(0, MAX_ROWS)
			const filteredRes = tmpResults.filter(val => getFilter(val))
			const _selectedTable = filteredRes.slice(0, state.rowsPerPage)
			const _isTruncated = results[_selectedTableName].length > MAX_ROWS
			const pageLen = Math.min(filteredRes.length, state.rowsPerPage)
			const _pages = Array.from({length: Math.ceil(filteredRes.length/pageLen)}, (_, i) => i + 1)

			if (mounted.current) {
				setState({
					...state,
					pageNumber: 0,
					storageData: filteredRes,
					tableNames: _tableNames,
					selectedTable: _selectedTable,
					selectedTableName: _selectedTableName,
					isTruncated: _isTruncated,
					pages: _pages,
					tableKeys: _tableKeys,
					isLoading: false
				})
			}
		})
		.catch(err => {
			//console.error(err)
		})
	}, [semester, instId, searchInput])

	// Sets the paginated rows and footer text
	useEffect(() => {
		if (state.isLoading === false)
		{
			let tmpVals = state.selectedTable.map((row, index) =>
				<tr key={index}>
					<td>{ row.play.user }</td>
					<td>{ row.play.firstName }</td>
					<td>{ row.play.lastName }</td>
					<td>{ row.play.cleanTime }</td>
					{Object.values(row.data).map((rowData, index) =>
						<td key={index} className={{'null': rowData === null}}>
							{ rowData }
						</td>
					)}

				</tr>
			)

			let text = tmpVals.length === state.rowsPerPage ? 
				`Showing ${state.startIndex + 1} to ${state.endIndex} of ${Math.min(state.storageData?.length, MAX_ROWS)} entries` :
				`Showing ${Math.min(tmpVals.length, state.startIndex + 1)} to ${Math.min(tmpVals.length, state.endIndex)} of 
				${tmpVals.length} entries (filtered from ${Math.min(state.storageData?.length, MAX_ROWS)} total entries)`

			setRowVals(tmpVals)
			setState({...state, footerText: text})
		}
	}, [state.isLoading,
		state.selectedTable,
		state.startIndex,
		state.endIndex,
		state.storageData,
		state.selectedTableName,
		state.pages,
		state.storageData,
		searchInput
	])

	const onChangePageCount = useCallback(newValue => {
		const numPages = Math.ceil(state.storageData?.length/newValue)
		const pagesArr = Array.from({length: numPages}, (_, i) => i + 1) // Generates list of ints 1 to numPages
		const startIndex = 0
		const endIndex = Math.min(state.storageData?.length, newValue)
		const _selectedTable = state.storageData?.slice(startIndex, endIndex)
		setState({...state, rowsPerPage: newValue, selectedTable: _selectedTable, startIndex: startIndex, endIndex: endIndex, pageNumber: 0, pages: pagesArr})
	}, [state])

	const onChangeTable = useCallback(_selectedTableName => {
		const numPages = Math.ceil(state.storageData?.length/state.rowsPerPage)
		const pagesArr = Array.from({length: numPages}, (_, i) => i + 1) // Generates list of ints 1 to numPages
		const startIndex = 0
		const endIndex = Math.min (state.storageData?.length, state.rowsPerPage + 1)
		const _selectedTable = state.storageData?.slice(startIndex, endIndex)
		const _isTruncated = _selectedTable.length > MAX_ROWS
		setState({...state, selectedTable: _selectedTable, selectedTableName: _selectedTableName, isTruncated: _isTruncated, startIndex: startIndex, endIndex: endIndex, pageNumber: 0, pages: pagesArr})
	}, [state])

	const onChangePageNumber = useCallback(newPageNum => {
		const startIndex = Math.min(state.storageData?.length, newPageNum*state.rowsPerPage)
		const endIndex = Math.min (state.storageData?.length, (newPageNum + 1)*state.rowsPerPage)
		const _selectedTable = state.storageData?.slice(startIndex, endIndex)
		setState({...state, startIndex: startIndex, endIndex: endIndex, selectedTable: _selectedTable, pageNumber: newPageNum})
	}, [state])

	const getPaginateBtns = useCallback(() => {
		let pagesArr = state.pages?.map((val, index) => {
			return(<a className={`paginate_button ${index === state.pageNumber ? 'current' : ''}`}
				aria-controls="DataTables_Table_1"
				tabIndex="0"
				onClick={() => {onChangePageNumber(index)}}
				key={index}>
				{index+1}
			</a>)
		})

		// Compresses the buttons
		if (pagesArr.length > 7) {
			const paginateIconL = <span className="ellipsis" key={999}>…</span>
			const paginateIconR = <span className="ellipsis" key={888}>…</span>
			const curPage = state.pageNumber + 1
			const numPages = pagesArr.length
			let paginateType = numPages - curPage >= 4 ?  
				(curPage <= 4 ? 
					"left" : 
					"middle") :
				"right"

			switch(paginateType) {
				case ("right"):
					pagesArr = [pagesArr[0]].concat(paginateIconR).concat(pagesArr.slice(pagesArr.length - 5, pagesArr.length))
					break
				case ("middle"):
					pagesArr = [pagesArr[0]].concat(paginateIconL).concat(pagesArr.slice(curPage - 2, curPage + 1)).concat(paginateIconR).concat(pagesArr[pagesArr.length - 1])
					break
				case ("left"):
					pagesArr = pagesArr.slice(0, 5).concat(paginateIconL).concat(pagesArr[pagesArr.length - 1])
					break
			}
		}

		setPageinateBtns(pagesArr)
	}, [state, searchInput])

	// Filters search
	const getFilter = useCallback((val) => {
		const firstLast = val.play.firstName + val.play.lastName
		const sanatizedSearch = searchInput.replace(/\s+/g, '').toUpperCase()

		if (searchInput.length === 0)
			return true

		// Matches by user
		if (val.play.user.replace(/\s+/g, '').toUpperCase().indexOf(sanatizedSearch) > -1)
			return true

		// Matches by first and last
		if (firstLast.replace(/\s+/g, '').toUpperCase().indexOf(sanatizedSearch) > -1)
			return true

		return false
	}, [searchInput])

	return (
		<div className={`display data ${state.isLoading ? 'loading' : ''}`} >

			{!state.isLoading
				? <React.Fragment>
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
								?	<select value={state.selectedTableName} onChange={e => {onChangeTable(e.target.value)}}>
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

						<table className="storage_table dataTable no-footer">
							<thead>
								<tr>
									<th>user</th>
									<th>firstName</th>
									<th>lastName</th>
									<th>time</th>
									{ 
										state.tableKeys.map((columName, index) =>
											<th key={index}>{columName}</th>
										)
									}
								</tr>
							</thead>
							<tbody>
								{ rowVals.length > 0
									? rowVals
									: <tr style={{height: "50px"}}></tr>
								}
							</tbody>
						</table>
						<div className="data_tables_info_holder">
							<div className="data_tables_info"
								role="status"
								aria-live="polite">
								{state.footerText}
							</div>
							<div className="data_tables_paginate" id="DataTables_Table_1_paginate">
								<a className={`paginate_button previous ${state.pageNumber - 1 < 0 ? 'disable' : ''}`}
									aria-controls="DataTables_Table_1"
									tabIndex="0"
									id="DataTables_Table_1_previous"
									onClick={() => {
										if (state.pageNumber - 1 >= 0) onChangePageNumber(state.pageNumber - 1)
									}}>
									Previous
								</a>
								<span>
									{
										paginateBtns
									}
								</span>
								<a className={`paginate_button next ${state.pageNumber + 1 >= state.pages?.length ? 'disable' : ''}`}
									aria-controls="DataTables_Table_1"
									tabIndex="0"
									id="DataTables_Table_1_next"
									onClick={() => {
										if (state.pageNumber + 1 < state.pages?.length) onChangePageNumber(state.pageNumber + 1)
									}}>
									Next
								</a>
							</div>
						</div>
					</div>
					</React.Fragment>
				: <div className="loading-holder">
						<LoadingIcon />
					</div>
			}
		</div>
	)
}

export default MyWidgetScoreSemesterStorage
