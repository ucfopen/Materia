app = angular.module 'materia'
app.controller 'widgetCatalogCtrl', ($scope, widgetSrv) ->

	featureKeys =
		customizable: 'Customizable'
		scorable: 'Scorable'
		mobile: 'Mobile Friendly'
		qa: 'Question/Answer'
		mc: 'Multiple Choice'
		media: 'Media'

	$scope.widgets = []
	$scope.filters =
		scorable:no
		customizable:no
		qa:no
		mc:no
		media:no

	$scope.displayAll = no

	hideFiltered = ->
		for widget, i in $scope.widgets
			wFeatures = widget.meta_data.features
			wSupport = widget.meta_data.supported_data
			widget.visible = yes

			for filterName, filterOn of $scope.filters
				metaValue = featureKeys[filterName]

				if filterOn and wFeatures.indexOf(metaValue) < 0 and wSupport.indexOf(metaValue) < 0
					widget.visible = no
					break

	# Display default "featured" widgets
	displayWidgets = ->
		Materia.Set.Throbber.startSpin '.page'
		widgetSrv.getWidgetsByType 'featured', (widgets) ->

			# setup some default values
			for widget, i in widgets
				widget.icon = Materia.Image.iconUrl widget.dir, 92
				widget.visible = yes

			Materia.Set.Throbber.stopSpin '.page'

			$scope.$watchCollection 'filters', hideFiltered

			$scope.widgets = widgets
			$scope.$apply()

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

	# DISPLAY_TYPE added from controller if it was passed as part of the URL
	if typeof DISPLAY_TYPE isnt 'undefined'

		switch DISPLAY_TYPE
			when 'all'
				$scope.displayAll = yes
			else
				displayWidgets()

	else
		# Load the widgets
		displayWidgets()

	$scope.$watch 'displayAll', ->
		if $scope.displayAll then displayAllWidgets()
		else displayWidgets()

