app = angular.module 'materia'
app.controller 'loginCtrl', ['$scope', '$sce', ($scope, $sce) ->
	# hide the labels initially
	$scope.username_opacity = 0
	$scope.password_opacity = 0

	# event handler for when one of the input boxes changes
	$scope.checkInput = ->
		$scope.username_opacity = 0
		$scope.password_opacity = 0

		# find the inputs and if they have an autocomplete value filled
		if !$scope.username
			$scope.username_opacity = 0.6

		if !$scope.password
			$scope.password_opacity = 0.6

	# Allow a timeout in case the user has autocomplete
	setTimeout ->
		$scope.checkInput()
		$scope.$apply()
	, 150

	# Widget login partial has this on widgets with expiration
	# NEEDS TESTING
	$scope.fixDate = (date) ->
		Materia.Set.DateTime.fixTime(date)

]

