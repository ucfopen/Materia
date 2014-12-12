'use strict'

MyWidgets = angular.module 'MyWidgets'
MyWidgets.directive 'scoreData', (selectedWidgetSrv) ->
	restrict: 'A',
	link: ($scope, $element, $attrs) ->

		if $attrs.hasStorage == "false" then return false

		id = $attrs.id.split("_")[1]

		storage = selectedWidgetSrv.getStorageData()
		storage.then (data) ->

			semester = $attrs.semester
			$scope.tables = data[semester]
			$scope.MAX_ROWS = selectedWidgetSrv.getMaxRows()

			$scope.tableNames = []

			$scope.tableNames.push(tableName) for tableName, tableData of $scope.tables

			$scope.selectedTable = $scope.tableNames[0]
			console.log $scope.tableNames
			console.log $scope.tables

		$scope.handleStorageDownload = ->
			console.log "handling it"