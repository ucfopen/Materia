app = angular.module 'materia'
app.controller 'currentUserCtrl', ($scope, $sce, userServ, $http, $rootScope) ->

	$scope.currentUser = userServ.getCurrentUser()
