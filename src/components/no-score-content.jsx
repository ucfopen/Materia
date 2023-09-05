import React from 'react'
import './no-content-icon.scss'

const NoScoreContent = ({beardMode}) => (
	<div id='no-score-content' className={`${beardMode ? 'bearded' : ''}`}>
		<p>Your widget hasn't recorded any scores yet!</p>
		<p>Once students play it, score information will be displayed here.</p>
	</div>
)

export default NoScoreContent
