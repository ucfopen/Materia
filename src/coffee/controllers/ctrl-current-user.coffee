app = angular.module 'materia'
app.controller 'currentUserCtrl', ($scope, $sce, userServ) ->

	$scope.currentUser = userServ.getCurrentUser()
	$scope.hasNoWidgets = false

	$scope.$on 'selectedWidget.hasNoWidgets', (evt) ->
		$scope.hasNoWidgets = true
		$scope.$apply()

