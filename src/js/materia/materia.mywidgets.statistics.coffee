# Handles the graphs/scoring table
Namespace('Materia.MyWidgets').Statistics = do ->
	_curTableOrder = 'desc'
	_plots = []

	# Uses jPlot to create the bargraph and piechart
	# @param    type		The type of graph that will be made (bargraph | pieChart)
	# @return   void
	createGraph = (elementId, data) ->
		if !_plots[elementId]?
			jqOptions =
				animate: true
				animateReplot: true
				series: [
						renderer:$.jqplot.BarRenderer
						shadow: false
						rendererOptions:
							animation:
								speed: 500
				]
				title:
					text: 'Score Distribution',
					fontFamily: 'Lato, Lucida Grande, Arial, sans'
				axesDefaults:
					tickRenderer: $.jqplot.CanvasAxisTickRenderer
					tickOptions:
						angle: 0,
						fontSize: '8pt'
				axes:
					xaxis:
						renderer: $.jqplot.CategoryAxisRenderer
						ticks: ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90-100']
				highlighter:
					show: true
					showMarker: false
					sizeAdjust: 7.5
					tooltipAxes: 'y'
					formatString: '%s scores'
				cursor:
					show: false
				grid:
					background: '#FFFFFF'
					shadow: false
				seriesColors: ['#1e91e1']

			plot = $.jqplot(elementId, [data], jqOptions)
			_plots[elementId] = plot
		else
			# to replot we need to format the data in the way jqPlot expects.
			# normally the "constructor" of jqplot does this transformation
			# but here we are accessing the data property directly.

			# TODO: This code is broken. Commenting it out seems to work fine. Necessary??
			# plot = _plots[elementId]
			# seriesData = []
			# seriesData.push [i+1, series] for series, i in data
			# plot.series[0].data = seriesData
			# plot.replot({resetAxes: true})

	clearGraphs = ->
		_plots = []

	 # Constructs the score table when the Table score tab is selected.
	 # @param sort 		the method used to sort the names (asc | desc | newest)
	 # @return void

	createGraph : createGraph
	clearGraphs : clearGraphs
