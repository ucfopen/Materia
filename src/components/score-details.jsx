import React from 'react'
import ScoreGraphic from './score-graphic'

const ScoreDetails = ({details, complete}) => {
	
	let detailsRender = []
	details.forEach((detail, i) => {
		let detailsTableRows = []
		let detailsHeaders = []
		detail.table.forEach((row, j) => {
			let detailsTableData = []
			if (row.graphic != 'none') {

				let greyMode = false
				const index = j + 1
				const percent = row.score / 100

				let scoreGraphic = null

				switch (row.graphic) {
					case 'modifier':
						greyMode = row.score === 0
						scoreGraphic = <ScoreGraphic type="modifier" width={50} height={50} set={i} number={index} percent={percent} greyMode={greyMode} />
						break
					case 'final':
						scoreGraphic = <ScoreGraphic type="final" width={50} height={50} set={i} number={index} percent={percent} greyMode={greyMode} />
						break
					case 'score':
						greyMode = row.score === -1
						scoreGraphic = <ScoreGraphic type="score" width={50} height={50} set={i} number={index} percent={percent} greyMode={greyMode} />
						break
				}

				detailsTableData.push(
					<td key={`details-index-${index}`} className="index">
						{scoreGraphic}
						{row.display_score &&
							<span>
								{row.score}{row.symbol}
							</span>
						}
					</td>
				)
			}

			row.data.forEach((data, index) => {
				detailsTableData.push(
					<td key={`${row.data_style[index]}-${index}`} className={row.data_style[index]}>{data}</td>
				)
			})

			detailsTableRows.push(
				<tr key={`details-row-${j + 1}`} className={`${row.style} ${row.feedback != null ? 'has_feedback' : ''}`}>
					{detailsTableData}
				</tr>
			)

			if (row.feedback != null) {
				detailsTableRows.push(
					<tr key={`details-feedback-${j + 2}`} className="feedback single_column">
						<td colSpan={row.data.length + 1}>
							<p>{row.feedback}</p>
						</td>
					</tr>
				)
			}

		})

		detail.header.forEach((header, i) => {
			detailsHeaders.push(
				<th key={`${header}-${i}`}>{header}</th>
			)
		})

		detailsRender.push(
			<section className={`details ${!complete ? 'incomplete' : ''}`} key={i}>
				<h1>{detail.title}</h1>
				<table>
					<thead>
						<tr className="details_header">
							{detailsHeaders}
						</tr>
					</thead>
					<tbody>
						{detailsTableRows}
					</tbody>
				</table>
			</section>
		)
	})

	return (
		<>
			{detailsRender}
		</>
	)
}

export default ScoreDetails