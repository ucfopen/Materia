'use strict'

const app = angular.module('materia')
app.directive('datatable', function ($compile, $timeout) {
	return {
		restrict: 'A',
		link($scope, $element, $attrs) {
			$timeout(() => {
				$($element).DataTable()
			})
		},
	}
})
