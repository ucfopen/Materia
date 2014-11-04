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
		Materia.MyWidgets.Sidebar.resetSearch()
		Materia.MyWidgets.Sidebar.prepare()
		widgetId = Materia.MyWidgets.SelectedWidget.getSelectedId()
		Materia.MyWidgets.Sidebar.setSelected(widgetId)

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

	getWidgets: getWidgets
	getWidget: getWidget
	sortWidgets: sortWidgets
	saveWidget: saveWidget
	addWidget: addWidget
