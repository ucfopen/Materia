'use strict'

app = angular.module 'materia'
app.directive 'datatable', ($compile, $timeout) ->
	restrict: 'A',
	link: ($scope, $element, $attrs) ->
		$timeout ->
			$($element).DataTable()
		null
