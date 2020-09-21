'use strict'

const app = angular.module('materia')
app.directive('scoreGraph', function ($timeout, SelectedWidgetSrv) {
	return {
		restrict: 'A',
		link($scope, $element, $attrs) {
			const id = $attrs.id.split('_')[1]

			const scores = SelectedWidgetSrv.getScoreSummaries()
			scores.then(function (data) {
				const brackets = data.map[id].distribution

				// Don't try creating a graph if there's nothing to put in it
				if (brackets) {
					// If we don't defer, Angular might overwrite our element
					$timeout(() => {
						Materia.MyWidgets.Statistics.createGraph($attrs.id, brackets)
					})
				}
			})
		},
	}
})
