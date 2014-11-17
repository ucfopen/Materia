app = angular.module 'materia'
app.directive 'fancybox', ($compile, $timeout) ->
	link: ($scope, element, attrs) ->
		$(element).fancybox
			onComplete: ->
				$timeout ->
					$compile($("#fancybox-content"))($scope)
					$scope.$apply()
					$.fancybox.resize()


