# Handles all of the calls for the sidebar
app = angular.module 'materia'
# The sidebar on My Widgets
app.controller 'SidebarController', ($scope, widgetSrv) ->
	$scope.setSelected = (id) ->
		widgetSrv.updateHashUrl(id)

