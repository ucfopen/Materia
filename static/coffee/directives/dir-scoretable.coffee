'use strict'

MyWidgets = angular.module 'MyWidgets'
MyWidgets.directive 'scoreTable', (selectedWidgetSrv) ->
	restrict: 'A',
	link: ($scope, $element, $attrs) ->

		widgetId = selectedWidgetSrv.getSelectedId()
		tableSort = 'desc'

		term = $attrs.term
		year = $attrs.year

		logs = selectedWidgetSrv.getPlayLogsForSemester term, year
		logs.then (data) ->
			Materia.MyWidgets.Statistics.createTable($attrs.id, data, tableSort, widgetId)