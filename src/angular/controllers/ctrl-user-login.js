const app = angular.module('materia')
app.controller(
	'UserLoginCtrl',
	($scope, DateTimeServ) =>
		// Widget login partial has this on widgets with expiration
		($scope.time = (date) => DateTimeServ.fixTime(date, $scope.date))
)
