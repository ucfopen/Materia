app = angular.module 'materia'
app.controller 'loginCtrl', ($scope, $sce) ->
	# Widget login partial has this on widgets with expiration
	$scope.time = (date) ->
		Materia.Set.DateTime.fixTime(date, $scope.date)

