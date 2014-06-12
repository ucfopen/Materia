
Namespace('Materia').Scores = do ->
	# attempts is an array of attempts, [0] is the newest
	attempts = null
	attempt_dates = null
	details = null
	# current attempt is the index of the attempt (the 1st attempt is attempts.length)
	currentAttempt = null
	templates = {}
	widgetInstance = null
	isPreview = false
	isEmbedded = false
	barPlot = null
	_graphData = []
	_inst_id = null
	_setupEvents = false

	init = (gateway) ->
		isPreview = /\/preview\//i.test(document.URL)

		# @TODO @IE8 This method of checking for isEmbedded is hacky, but
		# IE8 didn't like "window.self == window.top" (which also might be
		# problematic with weird plugins that put the page in an iframe).
		# This should work pretty well but if we ever decide to change the
		# scores embed URL this will need to be modified!
		isEmbedded = window.location.href.toLowerCase().indexOf('/scores/embed/') != -1

		play_id    = window.location.hash.split('play-')[1] # this is only actually set to something when coming from the profile page
		widget_id  = document.URL.match( /^[\.\w\/:]+\/([a-z0-9]+)/i )[1]

		attempts = []
		attempt_dates = []
		details = []

		# this was originally called in document.ready, but there's no reason to not put it in init
		Materia.Scores.displayScoreData(widget_id, play_id)

		$(window).bind('hashchange', getScoreDetails) # when the url has changes, reload the questions
		templates.overview = $('.overview').clone()
		templates.details = $('.details').clone()
		templates.title = $('article.container header > h1').clone()
		if(!isPreview && !isEmbedded)
			$('#class-rank-button').show()
			$('#class-rank-button').on('click', toggleClassRankGraph)

	displayScoreData = (inst_id, play_id) ->
		$.when( getWidgetInstance(inst_id), getInstanceScores(inst_id)  )
			.done ->
				#displayAttempts(play_id)
				Materia.Coms.Json.send('widget_instance_play_scores_get', [play_id], displayDetails)
				displayWidgetInstance()
			.fail ->
				# Failed!?!?

	getWidgetInstance = (inst_id) ->
		_inst_id = inst_id
		dfd = $.Deferred()
		Materia.Coms.Json.send 'widget_instances_get', [[inst_id]], (widgetInstances) ->
			dfd.reject('Unable to retrieve widget info') if widgetInstances.length < 1

			widgetInstance = widgetInstances[0]
			dfd.resolve()
		return dfd.promise()

	getInstanceScores = (inst_id) ->
		dfd = $.Deferred()
		if(isPreview)
			attempts = [{'id': -1, 'created_at' : 0, 'percent' : 0}]
			dfd.resolve() # skip, preview doesn't support this
		else
			Materia.Coms.Json.send 'widget_instance_scores_get', [inst_id], (scores) ->
				###
				if(scores == null || scores.length < 1)
					#load up an error screen of some sort
					$('article.container').remove()
					$error = $($('#t-restricted').html())
					$error.find('.page').css('width','auto')
					$('body').append($error)
					$error.show()
					dfd.reject('No scores for this widget')
				# Round scores
				for attemptScore in scores
					attemptScore.roundedPercent = String(parseFloat(attemptScore.percent).toFixed(2))
				###
				attempts = scores or []
				dfd.resolve()
		return dfd.promise()

	getScoreDetails = ->
		if(isPreview)
			currentAttempt = 1
			Materia.Coms.Json.send('widget_instance_play_scores_get', [null, widgetInstance.id], displayDetails)
		else
			# get the current attempt from the url
			hash = getAttemptNumberFromHash()
			return if currentAttempt == hash
			currentAttempt = hash
			#play_id = attempts[attempts.length - currentAttempt]['id']

			# The Materia sendoff link requires currentAttempt to be set, so it's here instead of displayWidgetInstance
			if isEmbedded == true
				prefix = '/scores/'
				$('#visit-materia').attr('href', prefix+widgetInstance.id+'#attempt-'+currentAttempt)

			# display existing data or get more from the server
			if details[attempts.length - currentAttempt]? displayDetails( details[attempts.length - currentAttempt] )
			else Materia.Coms.Json.send('widget_instance_play_scores_get', [play_id], displayDetails)

	displayWidgetInstance = ->
		# Build the data for the overview section, prep for display through Underscore
		hidePlayAgain = false
		overview_data =
			title : widgetInstance.name
			attempts : attempts
			dates    : attempt_dates

		if( widgetInstance.attempts <= 0 || ( widgetInstance.attempts > 0 && attempts.length < widgetInstance.attempts) || isPreview)
			prefix = if isEmbedded then '/embed/' else ( if isPreview then '/preview/' else '/play/')

			overview_data.href = prefix+widgetInstance.id + '/' + widgetInstance.clean_name
			if __LTI_TOKEN?
				overview_data.href += '?ltitoken=' + __LTI_TOKEN
			overview_data.play_again = if isPreview then 'Preview Again' else 'Play Again'
		else
			# if there are no attempts left, hide play again
			hidePlayAgain = true

		# Push overview data through Underscore
		updateHtmlTemplate(overview_data, 'header')

		# Modify display of several elements after HTML is outputted
		lengthRange = Math.floor(widgetInstance.name.length/10)
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

		$('article.container header > h1').css
			'font-size': textSize,
			'padding-top': paddingSize

		if (hidePlayAgain)
			$('#play-again').hide()

	displayAttempts = (play_id) ->
		if(isPreview)
			$('header').addClass('preview');
			currentAttempt = 1;
			getScoreDetails();
		else
			if(attempts instanceof Array && attempts.length > 0)
				matchedAttempt = false;
				for i in [0..attempts.length-1]
					d = new Date(attempts[i].created_at * 1000);

					# attempt_dates is used to populate the overview data in displayWidgetInstance, it's just assembled here.
					attempt_dates[i] = ((d.getMonth()+1) + '/' + d.getDate() + '/' + d.getFullYear());

					if(play_id == attempts[i].id) then  matchedAttempt = attempts.length - i;

				if(isPreview)
					window.location.hash = '#attempt-'+1;
				else if(matchedAttempt != false)
					# chainging the hash will call getScoreDetails();
					# currentAttempt = matchedAttempt
					window.location.hash = '#attempt-'+matchedAttempt;
					getScoreDetails();
				else if(getAttemptNumberFromHash() == undefined)
					window.location.hash = '#attempt-'+attempts.length;
				else
					getScoreDetails();

	# Uses jPlot to create the bargraph and piechart
	# @param    type		The type of graph that will be made (bargraph | pieChart)
	# @return   void
	toggleClassRankGraph = ->
		# toggle button text
		text = $('#class-rank-button').html()
		$('#class-rank-button').html( if text == 'Close Graph' then "Compare With Class" else 'Close Graph')

		# toggle graph visibility
		$('section.score-graph').slideToggle()

		# return if graph already built
		return if _graphData.length > 0

		# return if preview
		return if isPreview

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
			barPlot = $.jqplot('graph', [_graphData], jqOptions)

	displayDetails = (results) ->
		console.log results

		if !results
			$('article.container').remove()
			widget_data =
				href : "/preview/#{widgetInstance.id}/#{widgetInstance.clean_name}"

			updateHtmlTemplate(widget_data, 'expired')

			$error = $('#t-expired')
			$error.find('.page').css('width','auto')
			$error.show()
			return
		else
			$('div.expired').remove()

		details[attempts.length - currentAttempt] = results
		deets = results[0]

		# Round the score for display
		deets.overview.score = Math.round deets.overview.score
		for tableItem in deets.overview.table
			if tableItem.value.constructor is String then tableItem.value = parseFloat(tableItem.value)
			tableItem.value = tableItem.value.toFixed(2)

		for tableItem in deets.details[0].table
			score = parseFloat(tableItem.score)
			if(score != 0 && score != 100)
				tableItem.score = score.toFixed(2)

		updateHtmlTemplate(deets.overview, 'overview')

		if(!isEmbedded)
			updateHtmlTemplate(deets.details, 'details');
			addCircleToDetailTable(deets.details);

		if isPreview
			$('.overview hgroup h1').css('margin-top', 10)
			$('.previous-attempts').hide()

		$('.container').fadeIn ->
			if(isPreview)
				$('#class-rank-button').remove()
			else
				$('#class-rank-button').css('display', 'inline-block').on('click', toggleClassRankGraph)

		# TODO: This could really use cleaning up. It's still pretty hackish.

		#javascript hack to correct feedback/single-column box height
		#(required, since the absolute feedback columns don't flow)
		$('ul li.single_column').each (index) ->
			fixed_list_height = $(this).children(':first').height()
			$(this).height(fixed_list_height + 40)

			$('ul li.single_column').children().each (child_index) ->
				if $(this).index() isnt 0 then $(this).height(fixed_list_height)

		# setup Prev. Attempts menu
		if not _setupEvents
			_setupEvents = true
			$previousAttempts = $('.previous-attempts')
			if isMobile.any()
				$('.previous-attempts h1').on 'click', ->
					$previousAttempts.toggleClass('open')
				$('.previous-attempts a').on 'click', ->
					$previousAttempts.removeClass('open')
			else
				$previousAttempts.on 'mouseover', ->
					$previousAttempts.addClass('open')
				$previousAttempts.on 'mouseout', ->
					$previousAttempts.removeClass('open')

		sendPostMessage(deets.overview.score)

	updateHtmlTemplate = (data, template_name) ->
		data.attempt_num = currentAttempt
		markup = $('#score_'+template_name+'_template').html()
		if markup?
			compiled = _.template(markup, data, {'variable' : 'data'})
			$('.'+template_name).html(compiled)

	addCircleToDetailTable = (detail) ->
		for i in [0..detail.length-1]
			if detail[i]?
				for j in [0...detail[i].table.length]
					table = detail[i].table
					greyMode = false
					index = j+1
					canvas_id = 'question-'+(i+1)+'-'+index
					percent = table[j].score/100
					switch table[j].graphic
						when 'modifier'
							greyMode = table[j].score == 0
							Materia.Scores.Scoregraphics.drawModifierCircle(canvas_id, index, percent, greyMode)
						when 'final'
							Materia.Scores.Scoregraphics.drawFinalScoreCircle(canvas_id, index, percent)
						when 'score'
							greyMode = table[j].score == -1
							Materia.Scores.Scoregraphics.drawScoreCircle(canvas_id, index, percent, greyMode)

	sendPostMessage = (score) ->
		if(parent.postMessage && JSON.stringify)
			parent.postMessage(JSON.stringify({
				type:'materiaScoreRecorded',
				widget:widgetInstance,
				score:score
			}), '*')


	getAttemptNumberFromHash = ->
		hashStr = window.location.hash.split('-')[1]
		unless hashStr? then attempts.length else hashStr

	$(document).ready -> Materia.Scores.init(API_LINK)

	init              : init
	displayScoreData  : displayScoreData
