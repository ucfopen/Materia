app = angular.module 'materia'
app.controller 'adminUserController', ($scope, adminSrv, userServ) ->
	$scope.searchUser = (query) ->
		console.log query