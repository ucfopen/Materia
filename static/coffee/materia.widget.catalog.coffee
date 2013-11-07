Namespace('Materia.Widget').Catalog = do ->
	clean_name = null
	tumbnail = null
	_callback = null
	widgets = null

	#Executes the API function and then calls the replace default content
	prepare = (callback) ->
		_callback = callback
		Materia.Coms.Json.send 'widgets_get', null, (data) ->
			replaceDefault(data)

			$('.widget').mouseenter ->
				pos = $(this).index('.widget')
				card = Materia.Widget.Catalog.showInfocard(pos)

				if card?
					card.mouseleave -> Materia.Widget.Catalog.removeInfocard()

	replaceDefault = (widgetInfo) ->
		# store widgets in an empty jquery set
		$widgets = $([])

		Materia.Set.Throbber.startSpin('.page')

		$defaultContent = $($('#t-widget-card').html())

		for w in widgetInfo
			$middleContent = $defaultContent.clone()
			hideFeatures = true

			$middleContent.find('h1').children('a').attr('href', "/widgets/#{w.id}-#{w.clean_name}")
			$middleContent.addClass(w.clean_name)
			$middleContent.removeClass('hidden')
			$middleContent.attr('id', w.ID)

			#These if statments either populate content or deletes it.
			if w.meta_data['excerpt'] != null
				$middleContent.find('dt[data-type=description]').next().html(w.meta_data['excerpt'])
			else
				$middleContent.find('dt[data-type=description]').next().html('No description available.')

			if w.meta_data['features']? && w.meta_data['features'].length > 0
				w.meta_data['features'].sort()
				$featuresDt = $middleContent.find('dt[data-type=features]')
				$defaultFeatures = $featuresDt.next()
				for feature in w.meta_data['features']
					$featuresClone = $defaultFeatures.clone()
					$featuresClone.html(feature)
					$featuresDt.append($featuresClone)
				$defaultFeatures.remove()
			else
				features = $middleContent.find('dt[data-type=features]')
				$(features).next().remove()
				$(features).remove()

			if w.meta_data['supported_data']? && w.meta_data['supported_data'].length > 0
				w.meta_data['supported_data'].sort()
				supportedDt = $middleContent.find('dt[data-type=supported]')
				defaultSupported = supportedDt.next()
				for supported in w.meta_data['supported_data']
					supportedClone = defaultSupported.clone()
					$(supportedClone).html(supported)
					$(supportedDt).append(supportedClone)
				$(defaultSupported).remove()
			else
				supported = $middleContent.find('dt[data-type=supported]')
				$(supported).next().remove()
				$(supported).remove()

			if !w.meta_data['project']?
				project = $middleContent.find('dt[data-type=project]')
				$(project).next().html('General')

			$middleContent.children(':first-child').attr('href', "/widgets/#{w.id}-#{w.clean_name}")

			middleHtml = $middleContent.html()
			middleHtml = middleHtml.replace(/_template_name/g, w.name)

			$middleContent.html(middleHtml)
			$($middleContent).children(':first-child').children(':first-child').attr('src', Materia.Image.iconUrl(w.dir, 92))
			#Checks to make sure the image is there before overwriting the default icon.

			$middleContent.removeClass('template')
			$widgets = $widgets.add($middleContent)

		Materia.Set.Throbber.stopSpin('.page')
		$(".template").remove()

		if _callback? then _callback($widgets)

	showInfocard = (position) ->
		if isMobile.any()
			return null
		# remove any existing infocards
		$('.infocard').remove()
		infocard = $('<div>').addClass('infocard')

		# grab existing metadata from the widget and add the html to the infocard
		$widget = $('.widget').eq(position)
		cardContent = $('<a>').addClass('card-content').attr('href', $widget.find('a:first').attr('href'))
		cardContent.append($widget.html())
		cardContent.append($('<div>').addClass('clear'))
		infocard.append(cardContent)
		$('.catalog .widgets').append(infocard)

		# grab textBox's width/height so the card's outermost div can be resized appropriately
		cardWidth = $widget.width()

		# determine where the infocard should appear relative to the parent container
		left = $widget.position().left
		top = $widget.position().top + 5

		# update the css of the infocard with the new vals
		infocard.css
			top : top
			left : left
			width : cardWidth

		infocard.hide().fadeIn('fast')

		return $(infocard)

	removeInfocard = ->
		$('.infocard').fadeOut('fast').remove()

	prepare  : prepare
	replaceDefault : replaceDefault
	showInfocard : showInfocard
	removeInfocard : removeInfocard