'use strict'
// Tiny directive that handles applying the "allowfullscreen" attribute to the player iframe
// since the attribute does not take a parameter, it isn't as easy as allowfullscreen = {{allowFullScreen}} on the actual DOM element
const app = angular.module('materia')
app.directive('fullscreenDir', () => ({
	restrict: 'A',
	link($scope, $element, $attrs) {
		$scope.$watch('allowFullScreen', (newVal) => {
			if (newVal === true) {
				$attrs.$set('allowfullscreen', '')
			}
		})
	},
}))
