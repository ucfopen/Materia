import React from 'react'

const MyWidgetScoreSemesterSummary = ({students, totalScores, average}) => (
	<ul className='numeric'>
		<li>
			<h4>Students</h4>
			<p className='players'
				className='playerShrink'>
				{students}
			</p>
		</li>
		<li>
			<h4>Scores</h4>
			<p className='score-count'>
				{totalScores}
			</p>
		</li>
		<li>
			<h4>Avg Final Score</h4>
			<p className='final-average'>
				{average}
			</p>
		</li>
	</ul>
)

export default MyWidgetScoreSemesterSummary
