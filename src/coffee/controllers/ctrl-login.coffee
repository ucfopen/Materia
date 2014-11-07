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
		if $scope.username == ""
			$scope.username_opacity = 0.6

		if $scope.password == ""
			$scope.password_opacity = 0.6

	$('.available_time').each ->
		prevHTML = $(this).html()
		$(this).html(Materia.Set.DateTime.fixTime(parseInt(prevHTML), $('.server_date').html()))

	setTimeout($scope.checkInput, 150)
]

