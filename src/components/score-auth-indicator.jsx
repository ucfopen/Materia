import React from 'react'

const ScoreAuthIndicator = ({type}) => {
	const tooltipLti = 'LTI play sessions are launched from the LMS. They will return scores to the gradebook if supported.'
	const tooltipWeb = 'Web play sessions are launched from a play URL or embed frame. They do not communicate with the LMS.'
	return (
		<span className={`score-auth-indicator ${type}`} title={type == 'lti' ? tooltipLti : tooltipWeb}>
			{ type == 'lti' ? 'LTI' : 'WEB'}
		</span>
	)
}

export default ScoreAuthIndicator