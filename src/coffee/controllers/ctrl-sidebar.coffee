# Handles all of the calls for the sidebar
app = angular.module 'materia'
# The sidebar on My Widgets
app.controller 'SidebarController', ($rootScope, $scope, widgetSrv) ->
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
		console.log 'kay'
		console.log $scope.query

	$scope.clearSearch = ->
		$scope.query = ''
		$scope.searchResults.widgetList = []
		$scope.searchResults.widgetsTotal = 0