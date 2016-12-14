# Handles all of the calls for the sidebar
app = angular.module 'materia'
# The sidebar on My Widgets
app.controller 'SidebarController', ($rootScope, $scope, widgetSrv) ->
	$scope.setSelected = (id) ->
		widgetSrv.updateHashUrl(id)

	$scope.loadMore = ->
		$rootScope.$broadcast 'widgetList.update', ''