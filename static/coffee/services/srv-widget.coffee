MyWidgets = angular.module('MyWidgets')
MyWidgets.service 'widgetSrv', (selectedWidgetSrv, $q, $rootScope) ->

	deferred = $q.defer()
	_widgets = []
	widgetTemplate = null
	cache = null

	sortWidgets = -> # find all references and remove? Necessary?
		# unless cache?
		# 	cache = _widgets.slice()
		# 	cache.sort (a,b) -> return b.created_at - a.created_at
		# _buildSidebar cache

	getWidgets = ->
		if _widgets.length == 0
			Materia.WidgetInstance.clearAll()
			Materia.WidgetInstance.getAll (widgets) ->
				_widgets = widgets.slice(0)
				return deferred.resolve _widgets
		else
			return _widgets

	_buildSidebar = (cachedWidgets) ->
		myWidgets = []

		### Not all this stuff is baked into Angular functionality, so leaving commented code ###

		# $(widgetList).append(myWidgets)
		# $('.courses').animate opacity: 0.1
		# 	, 100, ->
		# 		$('.courses').html(widgetList)
		# 		selectedId = selectedWidgetSrv.getSelectedId()
		# 		if selectedId
		# 			$currentWidget = $('#widget_' + selectedId)
		# 			$currentWidget.addClass('gameSelected')
		# 			$courses = $currentWidget.parent().parent().parent()
		# 			parPos = $courses.offset()
		# 			$('.courses').scrollTop(0)
		# 		$('.courses').animate
		# 			opacity: 1
		# 			,100
		# 			, ->
		# 				if selectedWidgetSrv.getSelectedId()
		# 					pos = $('.gameSelected').position()
		# 					$('.courses').animate scrollTop: pos.top-200


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
		Materia.WidgetInstance.get inst_id, (widget) ->
			_widgets.push widget[0]
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
		else if index > 1
			selectedIndex = index - 1

		newWidget = _widgets[selectedIndex]
		if newWidget
			selectedWidgetSrv.set(newWidget)
		else
			selectedWidgetSrv.noWidgets()
		$rootScope.$broadcast 'widgetList.update', ''


	getWidgets: getWidgets
	getWidget: getWidget
	sortWidgets: sortWidgets
	saveWidget: saveWidget
	addWidget: addWidget
	removeWidget : removeWidget
