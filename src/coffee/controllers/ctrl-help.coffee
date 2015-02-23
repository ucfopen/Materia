app = angular.module 'materia'
app.controller 'helpCtrl', ($scope, $sce) ->
	Materia.Flashcheck.flashInstalled (version) ->
		if version == false or version.major <= 10
			$scope.noFlash = true
		else
			$scope.hasFlash = true

