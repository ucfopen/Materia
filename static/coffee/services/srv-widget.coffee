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
			selectedWidgetSrv.setSelected(newID)
		else
			selectedWidgetSrv.noWidgets()


	getWidgets: getWidgets
	getWidget: getWidget
	sortWidgets: sortWidgets
	saveWidget: saveWidget
	addWidget: addWidget
	removeWidget : removeWidget
