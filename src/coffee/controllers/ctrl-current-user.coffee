app = angular.module 'materia'
app.controller 'currentUserCtrl', ['$scope', '$sce', ($scope, $sce) ->

	userData = document.getElementById('current-user').dataset

	$scope.loggedIn = userData.loggedIn == 'true'
	$scope.currentUser =
		name: ''
		avatar: ''

	if $scope.loggedIn
		$scope.currentUser =
			name: userData.name
			avatar: userData.avatar


]
