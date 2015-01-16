# Handles all of the calls for the sidebar
app = angular.module 'materia'
# The sidebar on My Widgets
app.controller 'SidebarController', ($scope, widgetSrv, selectedWidgetSrv) ->

	$scope.setSelected = (id) ->
		widgetSrv.getWidget id, (inst) ->
			selectedWidgetSrv.set inst

