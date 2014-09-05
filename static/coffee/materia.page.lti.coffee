$ ->
	SEARCH_DELAY_MS = 200
	REFRESH_FAKE_DELAY_MS = 500
	CHANGE_SECTION_FADE_DELAY_MS = 250

	$widgetList = $('#list-container ul')
	selectedWidget = null
	widgetsLoaded = false

	if system != ''
		$('#success-message li:first-child').html('Students can interact with this widget in ' + system + '.')
		$('#success-message li:nth-child(2)').html('Any scores will be passed to ' + system + '.' )

	h1String = 'Select a Widget' + if system == '' then '' else ' for use in ' + system + ':'

	$('h1').html(h1String)

	hideRefreshLinkCallout = ->
		if $('#refresh').attr('showing-qtip') == 'true'
			$('.qtip').hide()

	calloutRefreshLink = ->
		if $('#refresh').attr('showing-qtip') != 'true'
			$('#refresh').attr('showing-qtip', 'true')

			$('body').append('<div class="qtip right lti">Click to see your new widget</div>')

	search = ->
		$('#list-container li').removeClass('selected')

		Materia.Widget.getWidgets (widgets) ->
			searchString = $.trim($('#search').val().toLowerCase().replace(/,/g, ' '))

			hits = []
			misses = []
			terms = searchString.split(' ')
			len = widgets.length
			len2 = terms.length
			match = $hits = null

			for i in [0...len]
				match = false
				for j in [0...len2]
					if(widgets[i].searchCache.indexOf(terms[j]) > -1)
						match = true
					else
						match = false
						break
				if match
					hits.push(widgets[i].element)
				else
					misses.push(widgets[i].element)

			$hits = $(hits)
			Materia.TextFilter.renderSearch($hits, $(misses), 'slide')

			Materia.TextFilter.clearHighlights($('#list-container li'))
			$hits.each ->
				Materia.TextFilter.highlight(searchString, $(this))

			if hits.length == 1
				$(hits[0]).addClass('selected')

	clearSearch = ->
		$('#search').val('')
		Materia.TextFilter.clearSearch('#list-container li')

	loadWidgets = (fakeDelay) ->
		$('#list-container li:not(.template)').remove()
		clearSearch()

		$('#refresh').hide()
		$('#no-widgets-container').hide()
		$('#goto-new-widgets').hide()

		Materia.Set.Throbber.startSpin('#list-container', {withBackground:false, withDelay:false})

		if fakeDelay?
			fakeDelay = 1

		setTimeout ->
			Materia.Widget.getWidgets (widgets) ->
				$('#refresh').show()

				widgetsLoaded = true

				Materia.Set.Throbber.stopSpin('#list-container')

				len = widgets.length
				curWidget = null

				if len == 0
					$('#no-widgets-container').show()
					$('#goto-new-widgets').hide()
				else
					$('#no-widgets-container').hide()
					$('#goto-new-widgets').show()

					for i in [0...len]
						addWidgetToList(widgets[i])

					$('.embed-button').click (event) ->
						event.preventDefault()

						inst_id = $(this).parents('#list-container li').attr('data-inst_id')
						Materia.Widget.getWidget inst_id, (widget) ->
							selectWidget(widget)

					$('#list-container li').click (event) ->
						$('#list-container li').removeClass('selected')
						$(this).addClass('selected')
			,
				ignoreCache: true,
				sort: 'alpha'
		, fakeDelay

	addWidgetToList = (instance) ->
		if instance.is_draft
			$newItem = $('.template.draft').clone()
			$newItem.removeClass('template')
			$newItem.find('.view-at-materia').attr('href', BASE_URL + 'my-widgets/#' + instance.id)
		else
			$newItem = $('.template:not(.draft)').clone().removeClass('template')

		$newItem.find('h2').html(instance.name)
		$newItem.find('h3').html(instance.widget.name)
		$newItem.find('.preview').attr('href', BASE_URL + 'preview/' + instance.id)
		$newItem.attr('data-inst_id', instance.id)

		$newItem.find('img').attr('src', Materia.Image.iconUrl(instance.widget.dir, 60))

		$widgetList.append($newItem)

		instance.element = $newItem.get(0)

	selectWidget = (widget) ->
		if selectedWidget?.state?.state == 'pending'
			return

		selectedWidget = widget
		selectedWidget.state = 'pending'

		setDisplayState('progress')

	finishProgressBarAndSetLocation = ->
		$('.progress-container').addClass('success')
		$('.progress-container').find('span').html('Success!')
		$('.progressbar').progressbar('value', 100)
		setTimeout ->
			announceChoice()

			if RETURN_URL? and RETURN_URL isnt null
				widgetURL = BASE_URL + 'lti/assignment?widget=' + selectedWidget.id
				window.location = RETURN_URL + '?embed_type=basic_lti&url=' + encodeURI(widgetURL)
		, 1000

	setDisplayState = (newSection) ->
		$('body')
			.removeClass('selectWidget')
			.removeClass('widgetSelected')
			.removeClass('progress')
			.addClass(newSection)

		if newSection == 'selectWidget'
			$('#list-container li').removeClass('selected')
			$('h1').html(h1String)
			if selectedWidget?
				$('.cancel-button').show()
			clearSearch()

			if !widgetsLoaded
				loadWidgets()

			$('#select-widget').fadeIn(CHANGE_SECTION_FADE_DELAY_MS)
		else if newSection == 'progress'
			$('#select-widget').fadeOut CHANGE_SECTION_FADE_DELAY_MS, ->
				$('#progress').fadeIn(CHANGE_SECTION_FADE_DELAY_MS)
			$('.progressbar').progressbar()
			$('#progress h1').html(selectedWidget.name)
			startProgressBar()
			$('#progress').find('.widget-icon').attr('src', Materia.Image.iconUrl(selectedWidget.widget.dir, 92))

	getRandInt = (min, max) -> Math.floor(Math.random() * (max - min + 1)) + min

	startProgressBar = ->
		# create a random number of progress bar stops
		availStops = [1,2,3,4,5,6,7,8,9]
		stops = tick: 0
	
		len = getRandInt(3, 5)
		for i in [0...len]
			stops[availStops.splice(getRandInt(0, availStops.length), 1)] = true

		intervalId = setInterval ->
			stops.tick++
			if stops[stops.tick]?
				$('.progressbar').progressbar('value', stops.tick * 10)

			if stops.tick >= 10
				clearInterval(intervalId)
				finishProgressBarAndSetLocation()
		, 200

		$(document).on 'keyup', (event) ->
			if event.keyCode == 16 # shift
				$('.progress-container').find('span').html('Reticulating splines...')
				$(document).off('keyup')

	getAvailabilityStr = (startDate, endDate) ->
		availability = Materia.Set.Availability.get(startDate, endDate)

		if endDate < 0 and startDate < 0
			return 'Anytime'
		else if startDate < 0 and endDate > 0
			return 'Open until ' + availability.end.date + ' at ' + availability.end.time
		else if startDate > 0 and endDate < 0
			return 'Anytime after ' + availability.start.date + ' at ' + availability.start.time
		else
			return 'From ' + availability.start.date + ' at ' + availability.start.time + ' until ' + availability.end.date + ' at  ' + availability.end.time

	announceChoice = ->
		widgetData = $.extend({}, selectedWidget)
		delete widgetData.element
		delete widgetData.searchCache

		# the host system can listen for this postMessage "message" event:
		if JSON.stringify
			if(parent.postMessage)
				parent.postMessage(JSON.stringify(widgetData), '*')

	$('#goto-new-widgets').click (event) ->
		calloutRefreshLink()

	$('#create-widget-button').click (event) ->
		calloutRefreshLink()

	$('#refresh').click (event) ->
		event.preventDefault()
		hideRefreshLinkCallout()
		loadWidgets(REFRESH_FAKE_DELAY_MS)

	$('.cancel-button').click (event) ->
		event.preventDefault()
		setDisplayState('widgetSelected')

	$('#search').keyup (event) ->
		if event.keyCode == 13 # enter
			$selected = $('#list-container li.selected')
			if $selected.length == 1
				inst_id = $($selected[0]).attr('data-inst_id')
				Materia.Widget.getWidget inst_id, (widget) ->
					selectWidget(widget)
		else if(event.keyCode == 27) #esc
			clearSearch()

	Materia.TextFilter.setupInput $('#search'), search, SEARCH_DELAY_MS

	setDisplayState 'selectWidget'
