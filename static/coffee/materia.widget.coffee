Namespace('Materia').Widget = do ->
	_widgets = []
	widgetTemplate = null
	cache = null

	sortWidgets = ->
		unless cache?
			cache = _widgets.slice()
			cache.sort (a,b) -> return b.created_at - a.created_at
		_buildSidebar cache

	getWidgets = (callback) ->
		if _widgets.length == 0
			Materia.WidgetInstance.clearAll()
			Materia.WidgetInstance.getAll (widgets) ->
				_widgets = widgets
				callback _widgets
		else
			callback _widgets

	_buildSidebar = (cachedWidgets) ->
		myWidgets = []

		unless widgetTemplate
			widgetTemplate = $("div[data-template=widget-list]")

		$clone = widgetTemplate
			.clone()
			.removeClass('_template_evenOdd')
			.removeClass('template')
			.removeAttr('data-template')
			.addClass('widget')

		clonedHtml = $clone.wrap('<div>').parent().html()
		widgetList = $('<div class="widget_list"></div>')

		for cached, i in cachedWidgets
			fixedHtml = clonedHtml
				.replace('_template_title', cached.name)
				.replace('_template_type', cached.widget.name)
				.replace('_template_scores', cached.numPlays + (cached.numPlays > 1 ? 's' : ''))

			$clonedListItem = $(fixedHtml)
				.attr('id', 'widget_' + cached.id)
				.attr('data-created', cached.dateCreate)
				.addClass( if i % 2 == 0 then 'odd' else 'even')

			if cached.is_draft is yes
				$clonedListItem.addClass("is_draft")
				$clonedListItem.find('.score').html('Draft')

			# Checks to make sure the image is there before overwriting the default icon.
			$clonedListItem.children('.icon').attr('src', Materia.Image.iconUrl(cached.widget.dir, 60))

			if BEARD_MODE? and BEARD_MODE is on
				rand = Math.floor((Math.random()*beards.length)+1) - 1
				$clonedListItem.children('div:first-child').addClass('small_'+beards[rand])

			clonedListItem = $clonedListItem.get(0)
			cached.element = clonedListItem

			myWidgets.push(clonedListItem)

		$(widgetList).append(myWidgets)
		$('.courses').animate opacity: 0.1
			, 100, ->
				$('.courses').html(widgetList)
				selectedId = Materia.MyWidgets.SelectedWidget.getSelectedId()
				if selectedId
					$currentWidget = $('#widget_' + selectedId)
					$currentWidget.addClass('gameSelected')
					$courses = $currentWidget.parent().parent().parent()
					parPos = $courses.offset()
					$('.courses').scrollTop(0)
				$('.courses').animate
					opacity: 1
					,100
					, ->
						if Materia.MyWidgets.SelectedWidget.getSelectedId()
							pos = $('.gameSelected').position()
							$('.courses').animate scrollTop: pos.top-200


	getWidget = (inst_id, callback) ->
		Materia.WidgetInstance.get inst_id, callback

	saveWidget = (_params, callback) ->
		params =
			widget_id: null
			qset: null
			is_draft: null
			inst_id: null
			open_at: null
			close_at: null
			attempts: null

		$.extend(params, _params)

		Materia.Coms.Json.send 'widget_instance_save', [params.widget_id, params.name, params.qset, params.is_draft, params.inst_id, params.open_at, params.close_at, params.attempts], (widget) ->
			if widget?
				Materia.WidgetInstance.updateWidget widget
				callback(widget)

	addWidget = (inst_id) ->
		# forces loading of the new widget
		Materia.WidgetInstance.get inst_id, ->
			# gets all of the widgets
			Materia.WidgetInstance.get null, (widgets) ->
				_widgets = widgets
				cache = null
				element = $('.typeSelected')

				#  removing the typeSelected class in advance to force sortWidgets to properly do its job.
				element.removeClass('typeSelected')
				Materia.MyWidgets.SelectedWidget.setSelected(inst_id)
				sortWidgets()

	removeWidget = (inst_id) ->
		widgetList = $('.widget_list').children()
		widgetListLength = widgetList.size()

		newID = null

		if widgetListLength > 1
			#get the id of the next widget in the list
			curWidge = $('.gameSelected')
			if curWidge.is(":first-child")
				newID = curWidge.next().attr('id').split('_')[1]
			else
				newID = curWidge.prev().attr('id').split('_')[1]
			curWidge.remove()

			#reset the odds/evens after the deleted widget is removed from the list
			$('.odd').removeClass('odd')
			$('.even').removeClass('even')
			for i in [0..widgetListLength]
				$(widgetList[i]).addClass( if i % 2 == 0 then 'odd' else 'even')
		else
			$('.gameSelected').remove()

		if newID?
			Materia.MyWidgets.SelectedWidget.setSelected(newID)
		else
			Materia.MyWidgets.SelectedWidget.noWidgets()


	getWidgets: getWidgets
	getWidget: getWidget
	sortWidgets: sortWidgets
	saveWidget: saveWidget
	addWidget: addWidget
	removeWidget : removeWidget
