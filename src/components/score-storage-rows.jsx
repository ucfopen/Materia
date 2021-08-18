import React, { useState, useEffect } from 'react'
import './my-widgets-settings-dialog.scss'

const PaginateButtons = ({isLoading, selectedValues, tableKeys}) => {
	const [rowVals, setRowVals] = useState([])

	// Creates the rows
	useEffect(() => {
		if (isLoading === false)
		{
			const tmpVals = selectedValues.map((row, index) =>
				<tr key={index}>
					<td>{ row.play.user }</td>
					<td>{ row.play.firstName }</td>
					<td>{ row.play.lastName }</td>
					<td>{ row.play.cleanTime }</td>
					{Object.values(row.data).map((rowData, indexData) =>
						<td key={indexData}>
							{ rowData }
						</td>
					)}

				</tr>
			)

			setRowVals(tmpVals)
		}
	}, [isLoading, selectedValues])

	const variableKeysRender = tableKeys.map((columName, index) =>
		<th key={index}>{columName}</th>
	)

	let storageRowsRender = <tr style={{height: '50px'}}></tr>
	if (rowVals.length > 0) {
		storageRowsRender = rowVals
	}

	return (
		<table className='storage_table dataTable'>
			<thead>
				<tr>
					<th>user</th>
					<th>firstName</th>
					<th>lastName</th>
					<th>time</th>
					{ variableKeysRender }
				</tr>
			</thead>
			<tbody>
				{ storageRowsRender }
			</tbody>
		</table>
	)
}

export default PaginateButtons
