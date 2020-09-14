import React, { useState, useEffect, useMemo, useCallback } from 'react'
import fetchOptions from '../util/fetch-options'

const fetchStorageData = (instId, term, year) => fetch('/api/json/play_storage_get', fetchOptions({body:`data=%5B%22${instId}%22%5D`}))

const defaultState = {
	rowsPerPage: 10,
	storageData: [],
	selectedTable: null,
	selectedTableName: null,
	anonymous: false,
	tableNames: [],
	isTruncated: false,
	isGuest: false,
	isLoading: true
}

const MyWidgetScoreSemesterStorage = ({semester, instId}) => {
	const MAX_ROWS = 100
	const [state, setState] = useState(defaultState)

	const onChangePageCount = useCallback(newValue => {
		const _selectedTable = state.storageData[state.selectedTableName].slice(0, newValue)
		const _isTruncated = _selectedTable.length < state.storageData[state.selectedTableName].length
		setState({...state, rowsPerPage: newValue, selectedTable: _selectedTable, isTruncated: _isTruncated})
	}, [state])

	const onChangeTable = useCallback(_selectedTableName => {
		const _selectedTable = state.storageData[_selectedTableName].slice(0, state.rowsPerPage)
		const _isTruncated = _selectedTable.length < state.storageData[_selectedTableName].length
		setState({...state, selectedTable: _selectedTable, selectedTableName: _selectedTableName, isTruncated: _isTruncated})
	}, [state])

	useEffect(() => {
		fetchStorageData(instId, semester.term, semester.year)
			.then(resp => resp.json())
			.then(results => {
				const _tableNames = Object.keys(results)
				const _selectedTableName = _tableNames[0]
				const _selectedTable = results[_selectedTableName].slice(0, state.rowsPerPage)
				const _isTruncated = _selectedTable.length < results[_selectedTableName].length

				setState({
					...state,
					storageData: results,
					tableNames: _tableNames,
					selectedTable: _selectedTable,
					selectedTableName: _selectedTableName,
					isTruncated: _isTruncated,
					isLoading: false
				})
			})
			.catch(err => {console.error(err)})
	}, [])

	return (
		<div className="display data" >

			{!state.isLoading
				? <React.Fragment>
					<div>
						<label>
							<input
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
						</div>
					</React.Fragment>
				: <div>Loading Storage Data...</div>
			}

		</div>
	)
}

export default MyWidgetScoreSemesterStorage
