'use strict'

app = angular.module 'materia'
app.directive 'scoreGraph', (selectedWidgetSrv) ->
	restrict: 'A',
	link: ($scope, $element, $attrs) ->

		id = $attrs.id.split("_")[1]

		scores = selectedWidgetSrv.getScoreSummaries()
		scores.then (data) ->
			brackets = data.map[id].distribution

			# Don't try creating a graph if there's nothing to put in it
			if brackets
				# If we don't defer, Angular might overwrite our element
				setTimeout ->
					Materia.MyWidgets.Statistics.createGraph($attrs.id, brackets)
				, 0
				null
