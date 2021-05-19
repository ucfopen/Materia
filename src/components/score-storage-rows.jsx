import React, { useState, useEffect } from 'react'
import "./my-widgets-settings-dialog.scss"

const PaginateButtons = ({isLoading, selectedValues, tableKeys}) => {
	const [rowVals, setRowVals] = useState([])

	// Creates the rows
	useEffect(() => {
		if (isLoading === false)
		{
			let tmpVals = selectedValues.map((row, index) =>
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
	}, [isLoading,
		selectedValues
	])
	
	return (
		<table className="storage_table dataTable">
			<thead>
				<tr>
					<th>user</th>
					<th>firstName</th>
					<th>lastName</th>
					<th>time</th>
					{ 
						tableKeys.map((columName, index) =>
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
	)
}

export default PaginateButtons
