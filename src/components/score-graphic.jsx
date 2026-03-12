import React, { useRef, useEffect } from 'react'

// renders the graphic displayed for default score screens that represents the score for an individual question
const ScoreGraphic = ({type, set=0, number, percent, greyMode}) => {
	
	let dotColor = 'rgba(225, 234, 221, 1)'
	let lineColor = '#7dba72'

	let finalPercent = percent

	switch (type) {
		case 'score':
			// choose the dot color based on the value if grey mode is enabled, the dot is greyed out.
			dotColor =
				greyMode === true
					? '#C3C5C8'
					: percent < 0.5
					? '#e2dcdf'
					: 'rgba(225, 234, 221, 1)'

			lineColor = greyMode === true ? '#B3B5B8' : '#7dba72'
			
			break
		case 'modifier':
			var percentColor = percent <= 0 ? '#db8081' : '#7dba72'
			dotColor = greyMode === true ? '#C3C5C8' : percentColor

			finalPercent = 1

			break
		
		case 'final':
			dotColor = '#db8081'
			finalPercent = 1
	}

	
	return (
		<div
			style={{backgroundColor: dotColor}}
			id={`question-${set + 1}-${number}`}
			className='question-number'>
			<div className='arc' style={{"--a": (finalPercent*100)+"%", backgroundColor: lineColor}}/>
			<p className='text'>{number}</p>
		</div>
	)
}

export default ScoreGraphic
