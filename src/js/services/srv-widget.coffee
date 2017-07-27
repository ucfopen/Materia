app = angular.module('materia')
app.service 'widgetSrv', (selectedWidgetSrv, dateTimeServ, $q, $rootScope, $window) ->

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

	getWidget = (id, callback) ->
		dfd = $.Deferred()
		if _widgetIds[id]?
			dfd.resolve _widgetIds[id]
		else
			_getFromServer id, (widgets) ->
				dfd.resolve widgets
				if callback
					callback(widgets)
		dfd.promise()

	getWidgetInfo = (id, callback) ->
		if id != null
			id = [[id]]
		Materia.Coms.Json.send 'widgets_get', id, callback

	getWidgetsByType = (type, callback) ->
		if type is null then type = 'featured'
		Materia.Coms.Json.send 'widgets_get_by_type', [type], callback

	saveWidgetTemplate = (obj, callback) ->
		Materia.Coms.Json.send 'widget_update', [obj], callback

	saveWidget = (_params, callback) ->
		params =
			qset: null
			is_draft: null
			open_at: null
			close_at: null
			attempts: null
			guest_access: null
			embedded_only: null

		$.extend(params, _params)

		if params.inst_id?
			Materia.Coms.Json.send 'widget_instance_update', [params.inst_id, params.name, params.qset, params.is_draft, params.open_at, params.close_at, params.attempts, params.guest_access, params.embedded_only], (widget) ->
				if widget?
					for i in [0..._widgets.length]
						if _widgets[i] == widget.id
							_widgets[i] = widget
							break
					_widgetIds[widget.id] = widget
					callback(widget)
		else
			Materia.Coms.Json.send 'widget_instance_new', [params.widget_id, params.name, params.qset, params.is_draft], (widget) ->
				if widget?
					# add to widgets
					_widgets.push widget
					_widgetIds[widget.id] = widget
					callback(widget)

	addWidget = (inst_id) ->
		getWidget(inst_id).then (widget) ->
			_widgets.push widget[0]
			sortWidgets()
			$rootScope.$broadcast 'widgetList.update', ''
			updateHashUrl widget[0].id

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
			updateHashUrl newWidget.id
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

	updateHashUrl = (widgetId) ->
		$window.location.hash = "/#{widgetId}"

	convertAvailibilityDates = (startDateInt, endDateInt) ->
		startDateInt = ~~startDateInt
		endDateInt = ~~endDateInt

		if endDateInt > 0
			endDate = dateTimeServ.parseObjectToDateString(endDateInt)
			endTime = dateTimeServ.parseTime(endDateInt)
		else
			endDate = endTime = 0

		if startDateInt > 0
			open_at = dateTimeServ.parseObjectToDateString(startDateInt)
			startTime = dateTimeServ.parseTime(startDateInt)
		else
			open_at = startTime = 0

		# return start, end datetime
		start:
			date:open_at
			time:startTime
		end:
			date:endDate
			time: endTime

	selectWidgetFromHashUrl = ->
		if $window.location.hash
			found = false
			selID = $window.location.hash.substr(1)
			if selID.substr(0, 1) == "/"
				selID = selID.substr(1)

			for widget in _widgets
				if widget.id == selID
					found = true
					break

			if found
				getWidget(selID).then (inst) ->
					selectedWidgetSrv.set inst
			else
				selectedWidgetSrv.notifyAccessDenied()

	$($window).bind 'hashchange', selectWidgetFromHashUrl

	getWidgets: getWidgets
	getWidgetsByType: getWidgetsByType
	getWidget: getWidget
	getWidgetInfo: getWidgetInfo
	sortWidgets: sortWidgets
	saveWidgetTemplate: saveWidgetTemplate
	saveWidget: saveWidget
	addWidget: addWidget
	removeWidget : removeWidget
	updateHashUrl: updateHashUrl
	selectWidgetFromHashUrl: selectWidgetFromHashUrl
	convertAvailibilityDates: convertAvailibilityDates

