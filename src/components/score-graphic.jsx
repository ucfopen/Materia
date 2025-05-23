import React, { useRef, useEffect } from 'react'

// renders the graphic displayed for default score screens that represents the score for an individual question
const ScoreGraphic = ({type, width, height, set, number, percent, greyMode}) => {
	
	const canvasRef = useRef(null)
	const canvas = canvasRef.current

	useEffect(() => {

		if (!canvas) return

		// to make the canvas look good on retina displays, we need to scale it up
		const h = height * 2
		const halfH = h / 2
		const lineWidth = 5
		const radius = (h - lineWidth) / 2
		canvas.width = h
		canvas.height = h

		if (canvas.getContext) {
			const context = canvas.getContext('2d')

			switch (type) {
				case 'score':
					// choose the dot color based on the value if grey mode is enabled, the dot is greyed out.
					var dotColor =
						greyMode === true
							? '#C3C5C8'
							: parseInt(percent, 10) !== 1
							? '#e2dcdf'
							: 'rgba(225, 234, 221, 1)'

					context.strokeStyle = greyMode === true ? '#B3B5B8' : '#db8081'
					context.beginPath()
					context.arc(halfH, halfH, radius, 0, Math.PI * 2, false)
					context.lineWidth = lineWidth - 0.5
					context.fillStyle = dotColor
					context.fill()
					context.stroke()

					// green
					var start = Math.PI * 2 * 0.75 // 90 degrees (NORTH)
					var end = start + Math.PI * 2 * percent
					context.strokeStyle = greyMode === true ? '#B3B5B8' : '#7dba72'
					context.beginPath()
					context.arc(halfH, halfH, radius, start, end, false)
					context.lineWidth = lineWidth
					context.stroke()

					var x = radius
					var y = radius

					context.font = 'bold 48px Lato'
					context.textAlign = 'center'
					context.textBaseline = 'middle'
					context.fillStyle = '#555555' // text color
					context.fillText(number, halfH, halfH)
					break
				case 'modifier':
					var percentColor = percent < 0 ? '#db8081' : '#7dba72'
					var dotColor = greyMode === true ? '#C3C5C8' : percentColor

					context.lineWidth = lineWidth - 0.5

					context.strokeStyle = greyMode === true ? '#B3B5B8' : '#555555'

					context.beginPath()
					context.arc(halfH, halfH, radius, 0, Math.PI * 2, false)
					context.fillStyle = dotColor
					context.fill()
					context.stroke()

					context.font = 'bold 28px Lato'
					context.textAlign = 'center'
					context.textBaseline = 'middle'
					context.fillStyle = '#555555' // text color
					context.fillText(number, halfH, halfH)
					break
				
				case 'final':
					const fillColor = '#db8081'

						context.strokeStyle = '555555'
						context.lineWidth = 2

						context.beginPath()
						context.arc(halfH, halfH, radius, 0, Math.PI * 2, false)
						context.fillStyle = fillColor
						context.fill()
						context.stroke()

						var start = Math.PI * 2 * 0.75 // 90 degrees (NORTH)
						var end = start + Math.PI * 2 * percent

						var greenSliceColor = '#7dba72'
						context.fillStyle = greenSliceColor

						context.beginPath()

						context.arc(halfH, halfH, radius - 1, start, end, false)
						context.lineTo(halfH, halfH)
						context.closePath()
						context.fill()
			}
			// scale the canvas based on the display dpi
			const dpi = window.devicePixelRatio;
			context.scale(dpi, dpi);
		}
	}, [canvas, percent])
	
	return (
		<canvas
			ref={canvasRef}
			style={{ width: `${width}px`, height: `${height}px` }}
			id={`question-${set + 1}-${number}`}
			className='question-number'>
			<p>{number}</p>
		</canvas>
	)
}

export default ScoreGraphic