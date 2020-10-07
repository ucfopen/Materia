// Handles the graphs/scoring table
Namespace('Materia.MyWidgets').Statistics = (() => {
	// Uses jPlot to create the bargraph and piechart
	// @param    elementId id of the div to place the graph
	// @param    data the data to graph
	// @return   void
	const createGraph = (elementId, data) => {
		const jqOptions = {
			animate: true,
			animateReplot: true,
			series: [
				{
					renderer: $.jqplot.BarRenderer,
					shadow: false,
					rendererOptions: {
						animation: {
							speed: 500,
						},
					},
				},
			],
			title: {
				text: 'Score Distribution',
				fontFamily: 'Lato, Lucida Grande, Arial, sans',
			},
			axesDefaults: {
				tickRenderer: $.jqplot.CanvasAxisTickRenderer,
				tickOptions: {
					angle: 0,
					fontSize: '8pt',
				},
			},
			axes: {
				xaxis: {
					renderer: $.jqplot.CategoryAxisRenderer,
					ticks: [
						'0-9',
						'10-19',
						'20-29',
						'30-39',
						'40-49',
						'50-59',
						'60-69',
						'70-79',
						'80-89',
						'90-100',
					],
				},
			},
			highlighter: {
				show: true,
				showMarker: false,
				sizeAdjust: 7.5,
				tooltipAxes: 'y',
				formatString: '%s scores',
			},
			cursor: {
				show: false,
			},
			grid: {
				background: '#FFFFFF',
				shadow: false,
			},
			seriesColors: ['#1e91e1'],
		}

		$.jqplot(elementId, [data], jqOptions)
	}

	return {
		createGraph,
	}
})()
