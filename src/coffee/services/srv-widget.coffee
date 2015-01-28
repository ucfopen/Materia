app = angular.module('materia')
app.service 'widgetSrv', (selectedWidgetSrv, $q, $rootScope) ->

	deferred = $q.defer()
	_widgets = []
	widgetTemplate = null
	cache = null

	sortWidgets = ->
		_widgets.sort (a,b) -> return b.created_at - a.created_at

	getWidgets = ->
		if _widgets.length == 0
			Materia.WidgetInstance.clearAll()
			Materia.WidgetInstance.getAll (widgets) ->
				_widgets = widgets.slice(0)
				sortWidgets()
				return deferred.resolve _widgets
		else
			return _widgets

	getWidget = (inst_id, callback) ->
		Materia.WidgetInstance.get inst_id, callback

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
				Materia.WidgetInstance.updateWidget widget
				callback(widget)

	addWidget = (inst_id) ->
		Materia.WidgetInstance.get inst_id, (widget) ->
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

	getWidgets: getWidgets
	getWidget: getWidget
	getWidgetInfo: getWidgetInfo
	sortWidgets: sortWidgets
	saveWidget: saveWidget
	addWidget: addWidget
	removeWidget : removeWidget

