'use strict'

app = angular.module 'materia'
app.directive 'scoreData', (selectedWidgetSrv, $window) ->
	restrict: 'A',
	link: ($scope, $element, $attrs) ->

		if $attrs.hasStorage == "false" then return false

		id = $attrs.id.split("_")[1]
		widgetId = selectedWidgetSrv.getSelectedId()
		semester = $attrs.semester

		storage = selectedWidgetSrv.getStorageData()
		storage.then (data) ->

			$scope.tables = data[semester]
			$scope.MAX_ROWS = selectedWidgetSrv.getMaxRows()

			$scope.tableNames = []

			$scope.tableNames.push(tableName) for tableName, tableData of $scope.tables

			$scope.selectedTable = $scope.tableNames[0]
