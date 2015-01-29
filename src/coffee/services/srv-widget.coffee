app = angular.module('materia')
app.service 'widgetSrv', (selectedWidgetSrv, $q, $rootScope) ->

	deferred = $q.defer()
	_widgets = []
	_widgetIds = {}
	gotAll = no
	widgetTemplate = null
	cache = null

	sortWidgets = ->
		_widgets.sort (a,b) -> return b.created_at - a.created_at

	getWidgets = ->
		if _widgets.length == 0 or not gotAll
			_gotAll = yes
			_getFromServer null, (widgets) ->
				_widgets = widgets.slice(0)
				sortWidgets()
				return deferred.resolve _widgets
		else
			return _widgets

	getWidget = (id) ->
		dfd = $.Deferred()
		if _widgetIds[id]?
			dfd.resolve _widgetIds[id]
		else
			_getFromServer id, (widgets) ->
				dfd.resolve widgets
		dfd.promise()

	getWidgetInfo = (id, callback) ->
		Materia.Coms.Json.send 'widgets_get', [[id]], callback

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
				for i in [0..._widgets.length]
					if _widgets[i] == widget.id
						_widgets[i] = widget
						break
				_widgetIds[widget.id] = widget
				callback(widget)

	addWidget = (inst_id) ->
		getWidget(inst_id).then (widget) ->
			_widgets.push widget[0]
			sortWidgets()
			$rootScope.$broadcast 'widgetList.update', ''
			selectedWidgetSrv.set widget[0]

	removeWidget = (inst_id) ->
		index = -1
		_widgets = _widgets.filter (widget, i) ->
			if widget.id is inst_id
				index = i
				return null
			else
				widget

		return if index is -1

		if index == 0
			selectedIndex = 0
		else if index > 0
			selectedIndex = index - 1

		newWidget = _widgets[selectedIndex]
		if newWidget
			selectedWidgetSrv.set(newWidget)
			sortWidgets()
		$rootScope.$broadcast 'widgetList.update', ''

	_getFromServer = (optionalId, callback) ->
		if optionalId? then optionalId = [[optionalId]]

		Materia.Coms.Json.send 'widget_instances_get', optionalId, (widgets) ->
			_widgets = []

			if widgets? and widgets.length?
				for i in [0...widgets.length]
					w = widgets[i]
					_widgetIds[w.id] = w
					_widgets.push(w)
					w.searchCache = "#{w.id} #{w.widget.name} #{w.name}".toLowerCase()

			callback(_widgets)

	getWidgets: getWidgets
	getWidget: getWidget
	getWidgetInfo: getWidgetInfo
	sortWidgets: sortWidgets
	saveWidget: saveWidget
	addWidget: addWidget
	removeWidget : removeWidget

