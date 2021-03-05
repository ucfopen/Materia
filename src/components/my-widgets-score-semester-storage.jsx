import React, { useState, useEffect, useMemo, useCallback } from 'react'
import fetchOptions from '../util/fetch-options'

const fetchStorageData = (instId, term, year) => fetch('/api/json/play_storage_get', fetchOptions({body:`data=%5B%22${instId}%22%5D`}))

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
	isTruncated: false,
	isGuest: false,
	isLoading: true
}

const MyWidgetScoreSemesterStorage = ({semester, instId}) => {
	const MAX_ROWS = 100
	const [state, setState] = useState(defaultState)

	const onChangePageCount = useCallback(newValue => {
		const numPages = Math.ceil(state.storageData[state.selectedTableName].length/newValue)
		const pagesArr = Array.from({length: numPages}, (_, i) => i + 1) // Generates list of ints 1 to numPages
		const startIndex = 0
		const endIndex = Math.min(state.storageData[state.selectedTableName].length, newValue)
		const _selectedTable = state.storageData[state.selectedTableName].slice(startIndex, endIndex)
		setState({...state, rowsPerPage: newValue, selectedTable: _selectedTable, startIndex: startIndex, endIndex: endIndex, pageNumber: 0, pages: pagesArr})
	}, [state])

	const onChangeTable = useCallback(_selectedTableName => {
		const numPages = Math.ceil(state.storageData[_selectedTableName].length/state.rowsPerPage)
		const pagesArr = Array.from({length: numPages}, (_, i) => i + 1) // Generates list of ints 1 to numPages
		const startIndex = 0
		const endIndex = Math.min (state.storageData[_selectedTableName].length, state.rowsPerPage + 1)
		const _selectedTable = state.storageData[_selectedTableName].slice(startIndex, endIndex)
		const _isTruncated = _selectedTable.length < MAX_ROWS
		setState({...state, selectedTable: _selectedTable, selectedTableName: _selectedTableName, isTruncated: _isTruncated, startIndex: startIndex, endIndex: endIndex, pageNumber: 0, pages: pagesArr})
	}, [state])

	const onChangePageNumber = useCallback(newPageNum => {
		const startIndex = Math.min(state.storageData[state.selectedTableName].length, newPageNum*state.rowsPerPage)
		const endIndex = Math.min (state.storageData[state.selectedTableName].length, (newPageNum + 1)*state.rowsPerPage)
		const _selectedTable = state.storageData[state.selectedTableName].slice(startIndex, endIndex)
		setState({...state, startIndex: startIndex, endIndex: endIndex, selectedTable: _selectedTable, pageNumber: newPageNum})
	}, [state])

	useEffect(() => {
		fetchStorageData(instId, semester.term, semester.year)
			.then(resp => resp.json())
			.then(results => {
				const _tableNames = Object.keys(results)
				const _selectedTableName = _tableNames[0]
				const _selectedTable = results[_selectedTableName].slice(0, state.rowsPerPage)
				const _isTruncated = results[_selectedTableName].length > MAX_ROWS
				const pageLen = Math.ceil(Math.min(results[_selectedTableName].length, MAX_ROWS) / state.rowsPerPage)
				const _pages = Array.from({length: pageLen}, (_, i) => i + 1)
				console.log(_selectedTable.length)

				setState({
					...state,
					storageData: results,
					tableNames: _tableNames,
					selectedTable: _selectedTable,
					selectedTableName: _selectedTableName,
					isTruncated: _isTruncated,
					pages: _pages,
					isLoading: false
				})
			})
			.catch(err => {console.error(err)})
	}, [semester, instId])

	return (
		<div className="display data" >

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
								<select value={state.selectedTableName} onChange={e => {onChangeTable(e.target.value)}}>
									{state.tableNames.map(name => <option key={name} value={name} >{name}</option>)}
								</select>
								</h4>
							</label>


							{state.isTruncated
								?	<p className="truncated-table">
										Showing only the first { MAX_ROWS } entries of this table.
										Download the table to see all entries.
									</p>
								: null
							}

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

							<table className="storage_table dataTable no-footer">
								<thead>
									<tr>
										<th>user</th>
										<th>firstName</th>
										<th>lastName</th>
										<th>time</th>
										{
											Object.keys(state.selectedTable[0].data).map((columName, index) =>
												<th key={index}>{columName}</th>
											)
										}
									</tr>
								</thead>
								<tbody>
									{
										state.selectedTable.map((row, index) =>
											<tr key={index}>
												<td>{ row.play.user }</td>
												<td>{ row.play.firstName }</td>
												<td>{ row.play.lastName }</td>
												<td>{ row.play.cleanTime }</td>
												{Object.values(row.data).map((rowData, index) =>
													<td key={index} className={{'null': rowData == null}}>
														{ rowData }
													</td>
												)}

											</tr>
										)
									}
								</tbody>
							</table>
							<div className="data_tables_info_holder">
								<div className="data_tables_info"
									role="status"
									aria-live="polite">
									Showing {state.startIndex + 1} to {state.endIndex} of {Math.min(state.storageData[state.selectedTableName]?.length, MAX_ROWS)} entries
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
											state.pages?.map((val, index) => {
												return(<a className={`paginate_button ${index === state.pageNumber ? 'current' : ''}`}
												aria-controls="DataTables_Table_1"
												tabIndex="0"
												onClick={() => {onChangePageNumber(index)}}
												key={index}>
												{index+1}
											</a>)
											})
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
				: <div>Loading Storage Data...</div>
			}

		</div>
	)
}

export default MyWidgetScoreSemesterStorage
