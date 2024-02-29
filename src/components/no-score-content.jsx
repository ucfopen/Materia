import React from 'react'
import './no-content-icon.scss'

const NoScoreContent = ({scorable, isDraft, beardMode}) => {

	const notScorableRender = 
		<div id='not-scorable' className={`${beardMode ? 'bearded' : ''}`}>
			<p>This widget can't collect scores.</p>
			<p>Certain widgets aren't designed to collect scores, and as a result, will not report interaction data.</p>
		</div>

	const noScoreContentRender = 
		<div id='no-score-content' className={`${beardMode ? 'bearded' : ''}`}>
			{ isDraft ? <p>Draft widgets cannot collect scores.</p> : <p>Your widget hasn't recorded any scores yet!</p> }
			{ isDraft ? <p>Publish your widget to enable score collection.</p> : <p>Once students play it, score information will be displayed here.</p> }
		</div>

	return scorable == 1 ? noScoreContentRender : notScorableRender
}

export default NoScoreContent
