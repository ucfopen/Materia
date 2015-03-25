app = angular.module 'materia'
app.controller 'scorePageController', ($scope, widgetSrv, scoreSrv) ->

	# attempts is an array of attempts, [0] is the newest
	attempt_dates = []
	details = []

	# current attempt is the index of the attempt (the 1st attempt is attempts.length)
	currentAttempt = null
	widgetInstance = null

	single_id = null
	isEmbedded = false
	isPreview = false

	_graphData = []

	COMPARE_TEXT_CLOSE = "Close Graph"
	COMPARE_TEXT_OPEN = "Compare With Class"
	$scope.classRankText = COMPARE_TEXT_OPEN

	isPreview = /\/preview\//i.test(document.URL)

	# @TODO @IE8 This method of checking for isEmbedded is hacky, but
	# IE8 didn't like "window.self == window.top" (which also might be
	# problematic with weird plugins that put the page in an iframe).
	# This should work pretty well but if we ever decide to change the
	# scores embed URL this will need to be modified!
	isEmbedded = window.location.href.toLowerCase().indexOf('/scores/embed/') != -1

	single_id  = window.location.hash.split('single-')[1]
	widget_id  = document.URL.match( /^[\.\w\/:]+\/([a-z0-9]+)/i )[1]

	# this is only actually set to something when coming from the profile page
	play_id    = window.location.hash.split('play-')[1]

	# when the url has changes, reload the questions
	$(window).bind 'hashchange', ->
		getScoreDetails()

	$scope.prevMouseOver = ->
		$scope.prevAttemptClass = "open"
	$scope.prevMouseOut = ->
		$scope.prevAttemptClass = ""
	$scope.prevClick = ->
		$scope.prevAttemptClass = "open"
	$scope.attemptClick = ->
		if isMobile.any()
			$scope.prevAttemptClass = ""

	$scope.isPreview = isPreview
	$scope.isEmbedded = isEmbedded
	$scope.showCompareWithClass = !isPreview and !isEmbedded

	displayScoreData = (inst_id, play_id) ->
		$.when(widgetSrv.getWidget(inst_id), getInstanceScores(inst_id))
			.done (widgetInstances) ->
				widgetInstance = widgetInstances[0]
				displayAttempts(play_id)
				displayWidgetInstance()
			.fail ->
				# Failed!?!?

	getInstanceScores = (inst_id) ->
		dfd = $.Deferred()
		if isPreview or single_id
			$scope.attempts = [{'id': -1, 'created_at' : 0, 'percent' : 0}]
			dfd.resolve() # skip, preview doesn't support this
		else
			scoreSrv.getWidgetInstanceScores inst_id, play_id, (scores) ->
				if scores == null or scores.length < 1
					#load up an error screen of some sort
					$scope.restricted = true
					$scope.$apply()
					dfd.reject 'No scores for this widget'
				# Round scores
				for attemptScore in scores
					attemptScore.roundedPercent = String(parseFloat(attemptScore.percent).toFixed(2))
				$scope.attempts = scores
				$scope.attempt = scores[0]
				$scope.$apply()
				dfd.resolve()
		return dfd.promise()

	getScoreDetails = ->
		if isPreview
			currentAttempt = 1
			scoreSrv.getWidgetInstancePlayScores [null, widgetInstance.id], displayDetails
		else if single_id
			scoreSrv.getWidgetInstancePlayScores [single_id], displayDetails
		else
			# get the current attempt from the url
			hash = getAttemptNumberFromHash()
			return if currentAttempt == hash
			currentAttempt = hash
			play_id = $scope.attempts[$scope.attempts.length - currentAttempt]['id']

			# The Materia sendoff link requires currentAttempt to be set, so it's here instead of displayWidgetInstance
			if isEmbedded
				prefix = '/scores/'
				token = if __LTI_TOKEN? then '?ltitoken=' + __LTI_TOKEN else ''
				$scope.moreInfoLink = prefix + widgetInstance.id + token + '#attempt-' + currentAttempt

			# display existing data or get more from the server
			if details[$scope.attempts.length - currentAttempt]?
				displayDetails details[$scope.attempts.length - currentAttempt]
			else scoreSrv.getWidgetInstancePlayScores [play_id], displayDetails
		$scope.$apply()

	displayWidgetInstance = ->
		# Build the data for the overview section, prep for display through Underscore
		hidePlayAgain = false
		widget =
			title : widgetInstance.name
			dates    : attempt_dates

		if (widgetInstance.attempts <= 0 || ( widgetInstance.attempts > 0 && $scope.attempts.length < widgetInstance.attempts) || isPreview) && !single_id
			prefix = switch
				when isEmbedded then '/embed/'
				when isPreview then '/preview/'
				else '/play/'

			widget.href = prefix+widgetInstance.id + '/' + widgetInstance.clean_name
			if __LTI_TOKEN?
				widget.href += '?ltitoken=' + __LTI_TOKEN
		else
			# if there are no attempts left, hide play again
			hidePlayAgain = true

		# If we have an LTI Token BUT this is not an embedded score page then we want to hide the play again button.
		# That way the user will have to return to the embedded instance of Materia to continue playing, preventing
		# issues with losing the LTI connection (as well as preventing duplicate page views of the same widget causing
		# confusion). If we don't do this then more logic will need to be added to handle passing the ltitoken around
		# and showing the proper scores page.
		if __LTI_TOKEN? and !isEmbedded
			hidePlayAgain = true

		# Modify display of several elements after HTML is outputted
		lengthRange = Math.floor widgetInstance.name.length / 10
		textSize    = parseInt($('article.container header > h1').css('font-size'))
		paddingSize = parseInt($('article.container header > h1').css('padding-top'))

		switch(lengthRange)
			when 0,1,2
				textSize    -= 4
				paddingSize += 4
			when 3
				textSize    -= 8
				paddingSize += 8
			else
				textSize    -= 12
				paddingSize += 12

		$scope.headerStyle = {
			'font-size': textSize,
			'padding-top': paddingSize
		}

		$scope.hidePlayAgain = hidePlayAgain
		$scope.hidePreviousAttempts = single_id
		$scope.widget = widget
		$scope.$apply()

	displayAttempts = (play_id) ->
		if isPreview
			currentAttempt = 1
			getScoreDetails()
		else
			if $scope.attempts instanceof Array and $scope.attempts.length > 0
				matchedAttempt = false
				for i in [0..$scope.attempts.length-1]
					d = new Date($scope.attempts[i].created_at * 1000)

					# attempt_dates is used to populate the overview data in displayWidgetInstance, it's just assembled here.
					attempt_dates[i] = (d.getMonth()+1) + '/' + d.getDate() + '/' + d.getFullYear()

					matchedAttempt = $scope.attempts.length - i if play_id == $scope.attempts[i].id

				if isPreview
					window.location.hash = '#attempt-'+1
				else if matchedAttempt != false
					# chainging the hash will call getScoreDetails()
					window.location.hash = '#attempt-'+matchedAttempt
					getScoreDetails()
				else if getAttemptNumberFromHash() == undefined
					window.location.hash = '#attempt-'+$scope.attempts.length
				else
					getScoreDetails()

	# Uses jPlot to create the bargraph
	$scope.toggleClassRankGraph = ->
		# toggle button text
		if $scope.graphShown
			$scope.classRankText = COMPARE_TEXT_OPEN
			$scope.graphShown = false
		else
			$scope.graphShown = true
			$scope.classRankText = COMPARE_TEXT_CLOSE

		# toggle graph visibility
		$('section.score-graph').slideToggle()

		# return if graph already built
		return if _graphData.length > 0

		# return if preview
		return if isPreview

		$LAB.script("/assets/js/lib/jquery.jqplot.min.cat.js").wait ->

			# ========== BUILD THE GRAPH =============
			Materia.Coms.Json.send 'score_summary_get', [widgetInstance.id], (data) ->

				# add up all semesters data into one dataset
				_graphData = [
					['0-9%',    0],
					['10-19%',  0],
					['20-29%',  0],
					['30-39%',  0],
					['40-49%',  0],
					['50-59%',  0],
					['60-69%',  0],
					['70-79%',  0],
					['80-89%',  0],
					['90-100%', 0]
				]

				for d in data
					for bracket, n in _graphData
						bracket[1] += d.distribution[n]

				# setup options
				jqOptions =
					animate: true,
					animateReplot: true,
					series: [
							renderer:$.jqplot.BarRenderer,
							shadow: false,
							color: '#1e91e1',
							rendererOptions:
								animation:
									speed: 500
					]
					seriesDefaults:
						showMarker:false,
						pointLabels:
							show: true,
							formatString:'%.0f',
							color: '#000'
					title:
						text: "Compare Your Score With Everyone Else's",
						fontFamily: 'Lato, Lucida Grande, Arial, sans'
					axesDefaults:
						tickRenderer: $.jqplot.CanvasAxisTickRenderer,
						tickOptions:
							angle: 0,
							fontSize: '8pt',
							color: '#000'
					axes:
						xaxis:
							renderer: $.jqplot.CategoryAxisRenderer,
							label:'Score Percent'
						yaxis:
							tickOptions:{formatString:'%.1f', angle: 45},
							label:'Number of Scores',
							labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
							color: '#000'
					cursor: {show: false},
					grid:{shadow: false}

				# light the fuse
				$.jqplot('graph', [_graphData], jqOptions)

	displayDetails = (results) ->
		$scope.show = true

		if !results
			widget_data =
				href : "/preview/#{widgetInstance.id}/#{widgetInstance.clean_name}"

			$scope.expired = true
			$scope.$apply()
			return

		details[$scope.attempts.length - currentAttempt] = results
		deets = results[0]

		return if not deets

		# Round the score for display
		deets.overview.score = Math.round deets.overview.score
		for tableItem in deets.overview.table
			tableItem.value = parseFloat(tableItem.value) if tableItem.value.constructor is String
			tableItem.value = tableItem.value.toFixed(2)

		for tableItem in deets.details[0].table
			score = parseFloat(tableItem.score)
			if score != 0 and score != 100
				tableItem.score = score.toFixed(2)

		if !isEmbedded
			setTimeout ->
				addCircleToDetailTable(deets.details)
			, 10

		sendPostMessage deets.overview.score
		$scope.overview = deets.overview
		$scope.dates = attempt_dates
		$scope.details = deets.details
		$scope.attempt_num = currentAttempt
		$scope.showCompareWithClass = !isPreview
		$scope.$apply()

	addCircleToDetailTable = (detail) ->
		for i in [0..detail.length-1]
			if detail[i]?
				for j in [0...detail[i].table.length]
					table = detail[i].table
					greyMode = false
					index = j+1
					canvas_id = 'question-'+(i+1)+'-'+index
					percent = table[j].score / 100
					switch table[j].graphic
						when 'modifier'
							greyMode = table[j].score == 0
							Materia.Scores.Scoregraphics.drawModifierCircle canvas_id, index, percent, greyMode
						when 'final'
							Materia.Scores.Scoregraphics.drawFinalScoreCircle canvas_id, index, percent
						when 'score'
							greyMode = table[j].score == -1
							Materia.Scores.Scoregraphics.drawScoreCircle canvas_id, index, percent, greyMode

	sendPostMessage = (score) ->
		if parent.postMessage and JSON.stringify
			parent.postMessage JSON.stringify(
				type: 'materiaScoreRecorded',
				widget: widgetInstance,
				score: score
			), '*'

	getAttemptNumberFromHash = ->
		hashStr = window.location.hash.split('-')[1]
		unless hashStr? then $scope.attempts.length else hashStr

	# this was originally called in document.ready, but there's no reason to not put it in init
	displayScoreData widget_id, play_id


