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
			plot = _plots[elementId]
			seriesData = []
			seriesData.push [i+1, series] for series, i in data
			plot.series[0].data = seriesData
			plot.replot({resetAxes: true})

	clearGraphs = ->
		_plots = []

	 # Constructs the score table when the Table score tab is selected.
	 # @param sort 		the method used to sort the names (asc | desc | newest)
	 # @return void

	createTable = ($tableContainer, log, sort = 'dec', inst_id) ->
		_curTableOrder = sort
		gameId        = $('.gameSelected').attr('id')
		$table        = $tableContainer.find('.scoreListTable')
		$userTable    = $tableContainer.find('.scoreTable')
		$userTableBox = $tableContainer.find('.scoreTableContainer')

		$table.html('')
		$userTableBox.css('opacity', 0)
		$userTable.html('')

		tableBody = $('<tbody>')

		$table.append(tableBody)

		# Query
		if log
			users      = []
			userCount  = 0
			usersFound = {}

			# Build users array
			$.each log, (i, playLog) ->
				uid  = playLog.user_id
				name = playLog.last+", "+playLog.first

				if !usersFound[uid]?
					usersFound[uid] = users.length
					users.push
						uid: uid
						name : name
						scores : {}

				users[usersFound[uid]].scores[playLog.time.toString()] =
					date : new Date(playLog.time*1000).toDateString()
					percent : playLog.perc
					elapsed : playLog.elapsed
					complete : playLog.done
					id: playLog.id

			# sort completed array based on sorting param
			switch sort
				when 'desc'
					users.sort (a,b) ->
						return 1 if (a.name > b.name)
						return -1 if (a.name < b.name)
				when 'asc'
					users.sort (a,b) ->
						return 1 if (a.name < b.name)
						return -1 if (a.name > b.name)

			# add each user to the list table and assign event listener
			$.each users, (index, user) ->
				$tr = $("<tr id='#{index}'></tr>")
				$tr.append $("<td class='listName'>#{user.name}</td>")
				tableBody.append($tr)

				$tr.click ->
					$('.rowSelected').removeClass 'rowSelected'
					$(this).addClass 'rowSelected'
					$userTableBox.stop()
					$userTableBox.css
						opacity: 0
						right: '0px'
					$userTable.html ''
					$userTableBody = $('<tbody>')
					$userTable.append $userTableBody

					$.each user.scores, (j, score) ->
						scoreMins      = (score.elapsed - score.elapsed % 60) / 60
						scoreSecs      = score.elapsed % 60
						$userTr        = $('<tr>')
						$userDateTd    = $('<td>').html score.date.substring(0, 10)
						$userPctTd     = if score.complete == '1' then $('<td>').html "#{parseFloat(score.percent).toFixed(2).replace('.00', '')}%" else $('<td>').html "---"
						$userElapsedTd = if scoreMins != 0 then $('<td>').html "#{scoreMins}m #{scoreSecs}s" else $('<td>').html "#{scoreSecs}s"

						$userTr.append $userDateTd
						$userTr.append $userPctTd
						$userTr.append $userElapsedTd.addClass 'elapsed'

						$userTr.click ->
							window.open "scores/" + inst_id + "/#single-" + score.id

						$userTableBody.append $userTr

					$userTableBox.css {opacity:1.00, right:'12px'}

	tableOrder = ->
		_curTableOrder

	searchScores = (search) ->
		$names  = $('.listName')
		search = $.trim search.toLowerCase().replace(/,/g, ' ')
		hits   = []
		misses = []
		terms  = search.split(' ')

		for i in [0..$names.length-1]
			match = false
			for term in terms
				if $names.eq(i).html().toLowerCase().indexOf(term) > -1
					match = true
				else
					match = false
					break
			if match
				hits.push($names.eq(i)[0])
			else
				misses.push($names.eq(i)[0])

		$hits = $(hits)
		Materia.TextFilter.renderSearch $hits, $(misses), 'nozebra'

		Materia.TextFilter.clearHighlights $('.listName')
		$hits.each -> Materia.TextFilter.highlight search, $(this)

	createGraph : createGraph
	clearGraphs : clearGraphs
	createTable : createTable
	tableOrder 	: tableOrder
	searchScores : searchScores
