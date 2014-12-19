app = angular.module 'materia'
app.controller 'loginCtrl', ['$scope', '$sce', ($scope, $sce) ->
	# Widget login partial has this on widgets with expiration
	# NEEDS TESTING
	$scope.fixDate = (date) ->
		Materia.Set.DateTime.fixTime(date)

]

