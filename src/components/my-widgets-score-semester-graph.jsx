import React from 'react'
import BarGraph from './bar-graph'
import MyWidgetScoreSemesterSummary from './my-widgets-score-semester-summary'

const MyWidgetScoreSemesterGraph = ({ semester }) => {

	let content = null
	if (semester.graphData != null) {
		content = <>
			<div className='display graph'>
				<BarGraph data={semester.graphData}
					width={530}
					height={300}
					rowLabel={'Score'}
					colLabel={'Plays'}
					graphTitle={'Score Distribution'}
				/>
			</div>
			<MyWidgetScoreSemesterSummary {...semester} />
		</>
	} else {
		content = (
			<div className="empty-distribution">
				<header>Score Summary Not Available</header>
				<p>Your widget doesn't have any completed play sessions. When score data is available, this section will be populated.</p>
			</div>
		)
	}

	return content
}

export default MyWidgetScoreSemesterGraph