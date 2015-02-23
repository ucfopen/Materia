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

	# Load the widgets
	widgetSrv.getWidgetInfo null, (widgets) ->
		Materia.Set.Throbber.startSpin '.page'

		# setup some default values
		for widget, i in widgets
			widget.icon = Materia.Image.iconUrl widget.dir, 92
			widget.visible = yes

		Materia.Set.Throbber.stopSpin '.page'

		$scope.$watchCollection 'filters', hideFiltered

		$scope.widgets = widgets
		$scope.$apply()

