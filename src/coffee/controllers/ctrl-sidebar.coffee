# Handles all of the calls for the sidebar
app = angular.module 'materia'
# The sidebar on My Widgets
app.controller 'SidebarController', ($rootScope, $scope, widgetSrv, beardServ) ->
	$scope.searchResults =
		widgetList: []
		widgetsTotal: 0

	$scope.setSelected = (id) ->
		widgetSrv.updateHashUrl(id)

	$scope.loadMore = ->
		$rootScope.$broadcast 'widgetList.update', ''
		# unless $scope.query
		# 	$rootScope.$broadcast 'widgetList.update', ''

	$scope.search = ->
		widgetSrv.searchWidgets $scope.query, (data) ->
			$scope.searchResults.widgetsTotal = data.total
			angular.forEach data.widgets, (widget, key) ->
				widget.icon = Materia.Image.iconUrl(widget.widget.dir, 60)
				widget.beard = beardServ.getRandomBeard()

			$scope.$apply ->
				$scope.searchResults.widgetList = data.widgets

	$scope.clearSearch = ->
		$scope.query = ''
		$scope.searchResults.widgetList = []
		$scope.searchResults.widgetsTotal = 0