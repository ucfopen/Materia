const app = angular.module('materia')
app.controller('UserCurrentCtrl', ($scope, $sce, UserServ, $http, $rootScope) => {
	$scope.currentUser = UserServ.getCurrentUser()
})
