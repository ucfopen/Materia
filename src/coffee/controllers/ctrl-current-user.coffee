app = angular.module 'materia'
app.controller 'currentUserCtrl', ($scope, $sce, userServ) ->

	$scope.currentUser = userServ.getCurrentUser()

