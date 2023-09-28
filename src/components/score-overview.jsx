import React, { useState, useEffect } from 'react'
import { apiGetScoreSummary } from '../util/api'
import { useQuery } from 'react-query'
import BarGraph from './bar-graph'

const ScoreOverview = ({inst_id, single_id, overview, attemptNum, isPreview, guestAccess}) => {

	const [showGraph, setShowGraph] = useState(null)

	// Gets score summary
	const { data: scoreSummary } = useQuery({
		queryKey: ['score-summary', inst_id],
		queryFn: () => apiGetScoreSummary(inst_id),
		staleTime: Infinity,
		enabled: !!inst_id && !single_id
	})

	let scoreGraphRender = null
	if (scoreSummary && scoreSummary[0]?.graphData) {
		scoreGraphRender = (
			<div className="graph">
				{
					scoreSummary !== undefined &&
					<BarGraph
						data={scoreSummary[0]?.graphData}
						width={746}
						height={300}
						rowLabel={'Scores Percent'}
						colLabel={'Number of Scores'}
						graphTitle={"Compare Your Score With Everyone Else's"}
					/>
				}
			</div>
		)
	}

	let overviewTable = []
	overview.table.forEach((row, index) => {
		overviewTable.push(
			<tr key={`${row}-${index}`}>
				<td>{row.message}</td>
				<td className={`${(row.value > -1) ? 'positive' : 'negative'} number`}>
					{row.value}{(row.symbol == null) ? '%' : row.symbol}
				</td>
			</tr>
		)
	})

	let classRankBtn = null
	if (!isPreview && scoreSummary) {
		classRankBtn = (
			<div id="class-rank-button" className="action_button" onClick={() => setShowGraph(!showGraph)}>
				{`${showGraph ? 'Close' : 'Compare With Class'}`}
			</div>
		)
	}

	let overviewContent = null
	if (overview && !overview.complete) {
		overviewContent = (
			<div id='overview-incomplete'>
				<h2>Incomplete Attempt</h2>
				<p>
					This student didn't complete this attempt.
					This score was not counted in any linked gradebooks and is only available for informational purposes.
				</p>
			</div>
		)
	} else {
		overviewContent = (
			<>
				<div id="overview-score">
					{!guestAccess && attemptNum ?
						<h1>Attempt <span className="attempt-num">{attemptNum}</span> Score:</h1>
						:
						<h1>This Attempt Score:</h1>
					}
					<span className="overall_score">{overview.score}<span className="percent">%</span></span>
					{classRankBtn}
				</div>
				<div id="overview-table">
					<table>
						<tbody>
							{overviewTable}
						</tbody>
					</table>
				</div>
			</>
		)
	}

	return (
		<>
			<section className={`overview ${isPreview ? 'preview' : ''}${!overview.complete ? 'incomplete' : ''}`}>
				{overviewContent}
			</section>
			<section className={`score-graph ${showGraph ? 'open' : ''}`}>
				{scoreGraphRender}
			</section>
		</>
	)
}

export default ScoreOverview
