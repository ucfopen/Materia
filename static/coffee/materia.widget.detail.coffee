Namespace('Materia.Widget').Detail = do ->
	SCREENSHOT_AMOUNT = 3

	init = (gateway) ->

	prepare = (callback) ->
		nameArr = window.location.pathname.replace("/widgets/", '').split("/")
		widgetID = nameArr.pop().split('-').shift()
		
		Materia.Coms.Json.send 'widgets_get', [[widgetID]], (data) ->
			populateDefaults(data[0])
			if nameArr.length > 1
				$('.widget_catalog_button').attr('href','/')
				$('.goBackText').text('Go back to the front page')

	# Populates the details page with content
	# @object The current widget.
	populateDefaults = (widget) ->
		clean_name = widget.clean_name

		$('.widget_icon').attr('src', Materia.Image.iconUrl(widget.dir, 394))

		$('.detail').children('h1').html(widget.name)

		if widget.meta_data['subheader']?
			$('.detail').children('h2').html(widget.meta_data['subheader'])
		else
			$('.detail').children('h2').remove()

		templateLi = $('.pics').children('li')

		if widget.meta_data['about'] == 'undefined'
			widget.meta_data['about'] = 'No description available.'

		$('.detail').after(widget.meta_data['about'])

		for x in [1..SCREENSHOT_AMOUNT]
			clonedLi = $(templateLi).clone()
			$(clonedLi)
				.children('a').attr('href', Materia.Image.screenshotUrl(widget.dir, x))
				.children('img').attr('src', Materia.Image.screenshotThumbUrl(widget.dir, x))
			$(templateLi).before(clonedLi)

		$('a.grouped_elements').fancybox()
		$(templateLi).remove()

		$meta_dataDl = $('#metaData')

		if widget.meta_data['features']? && widget.meta_data['features'].length > 0
			$meta_dataDl.append('<dt>Features:</dt>')
			for feature in widget.meta_data['features']
				$meta_dataDl.append($('<dd>').append($('<a>').addClass('feature').html(feature)))

		if widget.meta_data['supported_data']? && widget.meta_data['supported_data'].length > 0
			$meta_dataDl.append('<dt>Supported Data:</dt>')
			for data in widget.meta_data['supported_data']
				$meta_dataDl.append($('<dd>').append($('<a>').addClass('supported_data').html(data)))

		$('.widget_detail .feature, .widget_detail .supported_data').hover ->
			pos = null
			type = null

			if ($(this).hasClass('feature'))
				pos = $(this).index('.widget_detail .feature')
				type = '.feature'
			else if ($(this).hasClass('supported_data'))
				pos = $(this).index('.widget_detail .supported_data')
				type = '.supported_data'

			description = $(this).html()
			Materia.Widget.Detail.showToolTip(pos, description, type)

		, -> Materia.Widget.Detail.hideToolTip()

		$('#demoLink').attr('href', document.location.pathname+'/demo')
		$('#createLink').attr('href', document.location.pathname+'/create')

		$('.page').show()


	showToolTip = (pos, description, type) ->
		text = ''

		switch description
			when 'Customizable'
				text = 'As the widget creator, you supply the widget with data to make it relevant to your course.'
			when 'Scorable'
				text = 'This widget collects scores, and is well suited to gauge performance.'
			when 'Media'
				text = 'This widget uses image media as part of its supported data.'
			when 'Question/Answer'
				text = 'Users provide a typed response or associate a predefined answer wih each question.'
			when 'Multiple Choice'
				text = 'Users select a response from a collection of possible answers to questions provided by the widget.'
			when 'Mobile Friendly'
				text = 'Designed with HTML5 to work on mobile devices like the iPad and iPhone'
			else
				text = 'This feature has no additional information associated with it.'

		tt = $('<div>').addClass('tooltip').html(text)
		$('.widget_detail').append(tt)

		featureItem = $(type).eq(pos)

		left = featureItem.position().left
		height = tt.height()
		top = featureItem.position().top - height - 40

		tt.css
			'top' : top,
			'left' : left

		tt.fadeIn('fast')

	hideToolTip = ->
		tt = $('.widget_detail').find('.tooltip')
		$(tt).remove()

	init        : init,
	prepare     : prepare,
	showToolTip : showToolTip,
	hideToolTip : hideToolTip

