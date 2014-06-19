Namespace('Materia').WidgetInstance = do ->
	_widgets = null
	_widgetIds = {}
	_gotAll = no

	_getFromServer = (getWhat, callback) ->
		if getWhat? then getWhat = [[getWhat]]

		Materia.Coms.Json.send 'widget_instances_get', getWhat, (widgets) ->
			_widgets = []

			if widgets? && widgets.length?
				for i in [0...widgets.length]
					w = widgets[i]
					_widgetIds[w.id] = w
					_widgets.push(w)
					w.searchCache = "#{w.id} #{w.widget.name} #{w.name}".toLowerCase()

			callback(_widgets)

	clearAll = ->
		_widgets = null
		_widgetIds = {}
		_gotAll = no

	getAll = (callback) ->
		if _widgets? and _gotAll
			callback(_widgets)
		else
			_gotAll = yes
			_getFromServer null, callback

	get = (id, callback) ->
		if _widgetIds[id]?
			callback(_widgetIds[id])
		else
			_getFromServer id, callback

	updateWidget = (widget) ->
		for i in [0..._widgets.length]
			if _widgets[i] == widget.id
				_widgets[i] = widget
				break
		_widgetIds[widget.id] = widget
		null

	clearAll: clearAll
	updateWidget: updateWidget
	getAll: getAll
	get: get
