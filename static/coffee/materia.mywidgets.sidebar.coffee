# Handles all of the calls for the sidebar
app = angular.module('sidebarApp', [])

Namespace('Materia.MyWidgets').Sidebar = null

app.controller 'sidebarCtrl', ['$scope', '$location', ($scope, $location) ->
	$scope.widgets = []
	$scope.beard = false
	$scope.selected = null

	# ============ GET WIDGETS FROM SERVER =========================
	$scope.prepare = ->
		Materia.Widget.getWidgets (widgets) ->
			$scope.widgets = widgets
			console.log($scope.widgets)
			$scope.beard = BEARD_MODE? && BEARD_MODE == true
			$scope.$apply()
			Materia.Set.Throbber.stopSpin '.courses'

			$scope.buildDefaultList widgets

			# if there's a hash, select it
			if $location.path() && !$scope.selected
				selID = $location.path().substr(1)

				for widget in $scope.widgets
					if widget.id == selID
						found = true
						break
				if found
					Materia.MyWidgets.SelectedWidget.setSelected selID
				else
					Materia.MyWidgets.SelectedWidget.noAccess()

	$scope.resetSearch = ->
		$scope.searchText = ''

	$scope.getIcon = (widget) ->
		Materia.Image.iconUrl(widget.dir, 60)

	$scope.setSelected = (widgetId) ->
		for widget in $scope.widgets
			if widget.selected = true
				widget.selected = false
			if widget.id == widgetId
				Materia.MyWidgets.SelectedWidget.setSelected widgetId
				$scope.selected = widgetId
				widget.selected = true

	$scope.getSelected = ->
		$scope.selected

	$scope.removeWidget = (widgetId) ->
		found = null
		i = 0
		for widget in $scope.widgets
			if widget.id == widgetId
				break
			i++
		$scope.widgets.splice(i, 1)
		$scope.$apply()

		if $scope.widgets.length > 0
			if i == 0
				newSelected = 0
			else
				newSelected = i - 1
			Materia.MyWidgets.SelectedWidget.setSelected($scope.widgets[newSelected].id)
			$scope.setSelected($scope.widgets[newSelected].id)
		else
			Materia.MyWidgets.SelectedWidget.noWidgets()
			$scope.selected = null

	# Builds the sidebar with all of the widgets that come back from the api.
	# @var array A list of widget objects
	$scope.buildDefaultList = (widgets) ->
		len = widgets.length
		rightSide = $('section.directions')

		if len == 0
			Materia.MyWidgets.SelectedWidget.noWidgets()
		else
			rightSide.addClass 'unchosen'

	$scope.getWidgetByURL = ->
		newHash = $location.path()
		if newHash
			widgetID = newHash.substr(1)
		else
			return false

		for widget in $scope.widgets
			if widget.id == widgetID
				found = widget
				break
		if found
			$scope.setSelected(found.id)
		else
			Materia.MyWidgets.SelectedWidget.noAccess()

		false

	Namespace('Materia.MyWidgets').Sidebar =
		prepare: $scope.prepare
		search: $scope.search
		getWidgetByURL: $scope.getWidgetByURL
		setSelected: $scope.setSelected
		getSelected: $scope.getSelected
		resetSearch: $scope.resetSearch
		removeWidget: $scope.removeWidget
]
