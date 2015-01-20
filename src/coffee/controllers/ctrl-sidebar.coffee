# Handles all of the calls for the sidebar
app = angular.module 'materia'
# The sidebar on My Widgets
app.controller 'SidebarController', ($scope, $window) ->
	$scope.setSelected = (id) ->
		$window.location.hash = "/#{id}"

