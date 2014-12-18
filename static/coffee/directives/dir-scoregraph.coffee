'use strict'

MyWidgets = angular.module 'MyWidgets'
MyWidgets.directive 'scoreGraph', (selectedWidgetSrv) ->
	restrict: 'A',
	link: ($scope, $element, $attrs) ->

		id = $attrs.id.split("_")[1]

		scores = selectedWidgetSrv.getScoreSummaries()
		scores.then (data) ->
			brackets = data.map[id].distribution
			Materia.MyWidgets.Statistics.createGraph($attrs.id, brackets)