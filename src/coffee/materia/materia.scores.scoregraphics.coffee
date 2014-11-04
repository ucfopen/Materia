Namespace('Materia.Scores').Scoregraphics = do ->

	drawScoreCircle = (canvasName, number, percent, greyMode) ->
		canvas = $('#'+canvasName)
		h = parseInt(canvas.css('height'), 10)
		halfH = h/2
		lineWidth = 5
		radius = (h - lineWidth)/2
		canvas.attr('height', h).attr('width', h)

		if canvas[0].getContext
			context = canvas[0].getContext('2d')

			# choose the dot color based on the value if grey mode is enabled, the dot is greyed out.
			dotColor = if greyMode == on then '#C3C5C8' else ( if parseInt(percent, 10) != 1 then "#e2dcdf" else  "rgba(106, 148, 81, .2)" )

			#
			context.strokeStyle = if greyMode == on then "#B3B5B8" else "#db8081"
			context.beginPath()
			context.arc(halfH, halfH, radius, 0, Math.PI*2, false)
			context.lineWidth = lineWidth-0.5
			context.fillStyle = dotColor
			context.fill()
			context.stroke()

			# green
			start = Math.PI * 2 * 0.75 # 90 degrees (NORTH)
			end =  start + Math.PI * 2 * percent
			context.strokeStyle = if greyMode == true then "#B3B5B8" else "#7dba72"
			context.beginPath()
			context.arc(halfH, halfH, radius, start, end, false)
			context.lineWidth = lineWidth
			context.stroke()

			x = radius
			y = radius

			context.font = "bold 28px Lato"
			context.textAlign = "center"
			context.textBaseline = "middle"
			context.fillStyle = "#555555" # text color
			context.fillText(number, halfH, halfH)

	drawModifierCircle = (canvasName, number, percent, greyMode) ->
		canvas = $('#'+canvasName)
		h = parseInt(canvas.css('height'))
		halfH = h/2
		lineWidth = 5
		radius = (h - lineWidth)/2
		canvas.attr('height', h)
		canvas.attr('width', h)


		if canvas[0].getContext
			context = canvas[0].getContext('2d')

			# choose the dot color based on the value if grey mode is enabled, the dot is greyed out.

			percentColor =  if percent < 0 then '#db8081' else '#7dba72'
			dotColor = if greyMode == true then '#C3C5C8' else percentColor

			context.lineWidth = lineWidth-0.5

			context.strokeStyle = if greyMode == true then '#B3B5B8' else '#555555'

			context.beginPath()
			context.arc(halfH, halfH, radius, 0, Math.PI*2, false)
			context.fillStyle = dotColor
			context.fill()
			context.stroke()

			context.font = "bold 28px Lato"
			context.textAlign = "center"
			context.textBaseline = "middle"
			context.fillStyle = "#555555" # text color
			context.fillText(number, halfH, halfH)

	drawFinalScoreCircle = (canvasName, number, percent) ->
		canvas = $('#'+canvasName)
		h = parseInt(canvas.css('height'))
		halfH = h/2
		radius = (h-2)/2
		canvas.attr('height', h)
		canvas.attr('width', h)

		if canvas[0].getContext
			context = canvas[0].getContext('2d')
			fillColor = '#db8081'

			context.strokeStyle = '555555'
			context.lineWidth = 2

			context.beginPath()
			context.arc(halfH, halfH, radius, 0, Math.PI*2, false)
			context.fillStyle = fillColor
			context.fill()
			context.stroke()

			start = Math.PI*2*0.75 # 90 degrees (NORTH)
			end =  start + Math.PI*2*percent

			greenSliceColor = '#7dba72'
			context.fillStyle = greenSliceColor

			context.beginPath()

			context.arc(halfH, halfH, (radius-1), start, end, false)
			context.lineTo(halfH, halfH)
			context.closePath()
			context.fill()


	drawScoreCircle : drawScoreCircle,
	drawModifierCircle : drawModifierCircle,
	drawFinalScoreCircle : drawFinalScoreCircle