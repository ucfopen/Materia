app = angular.module 'materia'
app.controller 'loginCtrl', ($scope, $sce, dateTimeServ) ->
	# Widget login partial has this on widgets with expiration
	$scope.time = (date) ->
		dateTimeServ.fixTime(date, $scope.date)

