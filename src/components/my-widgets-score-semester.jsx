import React, { useState, useMemo } from 'react'

import MyWidgetScoreSemesterIndividual from './my-widgets-score-semester-individual'
import MyWidgetScoreSemesterStorage from './my-widgets-score-semester-storage'
import MyWidgetScoreSemesterGraph from './my-widgets-score-semester-graph'

const TAB_GRAPH='TAB_GRAPH'
const TAB_INDIVIDUAL='TAB_INDIVIDUAL'
const TAB_STORAGE='TAB_STORAGE'

const MyWidgetScoreSemester = ({semester, instId}) => {
	const [scoreTab, setScoreTab] = useState(TAB_GRAPH)

	const activeTab = useMemo(() => {
			switch(scoreTab){
				case TAB_GRAPH:
					return <MyWidgetScoreSemesterGraph semester={semester} />

				case TAB_INDIVIDUAL:
					return <MyWidgetScoreSemesterIndividual semester={semester} instId={instId} />

				case TAB_STORAGE:
					return <MyWidgetScoreSemesterStorage semester={semester} instId={instId} />
			}
		}, [scoreTab, semester]
	)

	return (
		<div className="scoreWrapper">
			<h3 className="view">{semester.term} {semester.year}</h3>
			<ul className="choices">
				<li className={scoreTab == TAB_GRAPH ? 'scoreTypeSelected' : ''}>
					<a className="graph" onClick={() => {setScoreTab(TAB_GRAPH)}}>
						Graph
					</a>
				</li>
				<li className={scoreTab == TAB_INDIVIDUAL ? 'scoreTypeSelected' : ''}>
					<a className="table" onClick={() => {setScoreTab(TAB_INDIVIDUAL)}}>
						Individual Scores
					</a>
				</li>

				{semester.storage
					? <li className={scoreTab == TAB_STORAGE ? 'scoreTypeSelected' : ''}>
						<a className="data" onClick={() => {setScoreTab(TAB_STORAGE)}}>
							Data
						</a>
					</li>
					: null
				}
			</ul>

			{activeTab}

		</div>
	)
}

export default MyWidgetScoreSemester
