'use strict'

const app = angular.module('materia')
app.directive('scoreData', function (SelectedWidgetSrv, $window) {
	return {
		restrict: 'A',
		link($scope, $element, $attrs) {
			if ($attrs.hasStorage === 'false') {
				return false
			}

			const { semester } = $attrs

			const updateDisplay = () => {
				// load the storageData from cache (if we have it)
				SelectedWidgetSrv.getStorageData(false).then((data) => {
					if (!data) return
					$scope.tables = data[semester]
					$scope.MAX_ROWS = SelectedWidgetSrv.getMaxRows()
					$scope.tableNames = Object.keys($scope.tables)
					$scope.selectedTable = $scope.tableNames[0]
				})
			}

			// the controller will dispatch this when the data is loaded
			$scope.$on('storageData.loaded', () => {
				updateDisplay()
			})

			// try to load it now
			updateDisplay()
		},
	}
})
