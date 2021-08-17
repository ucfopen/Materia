import React from 'react'
import BarGraph from './bar-graph'
import MyWidgetScoreSemesterSummary from './my-widgets-score-semester-summary'

const MyWidgetScoreSemesterGraph = ({semester}) => (
	<>
		<div className='display graph'>
			<BarGraph data={semester.graphData}
				width={530}
				height={300}
			/>
		</div>
		<MyWidgetScoreSemesterSummary {...semester} />
	</>
)

export default MyWidgetScoreSemesterGraph
