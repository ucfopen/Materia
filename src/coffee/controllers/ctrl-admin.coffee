app = angular.module 'materia'
app.controller 'adminController', ($scope, widgetSrv) ->
	# Display ALL the widgets
	displayAllWidgets = ->
		Materia.Set.Throbber.startSpin '.page'
		widgetSrv.getWidgetsByType 'all', (widgets) ->

			for widget, i in widgets
				widget.icon = Materia.Image.iconUrl widget.dir, 92
				widget.visible = yes

			Materia.Set.Throbber.stopSpin '.page'

			$scope.$watchCollection 'filters', hideFiltered

			$scope.widgets = widgets
			$scope.$apply()