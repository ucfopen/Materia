'use strict'

# This is essentially replacing mywidgets.selectedwidget.coffee's 'SetSelectedWidget' method
app = angular.module 'materia'
app.directive 'sidebarSelection', (selectedWidgetSrv, $compile) ->
	restrict: 'A'
	($scope, $element, $attrs) ->
		console.log $scope
		console.log $element
		console.log $attrs
		# element = $element[0]
		$element.bind "click", (event) ->
			# spinner-ify
			console.log "woo!"
			if $('.page').is ':visible' and not $('section .error').is ':visible'
				Materia.Set.Throbber.startSpin '.page'

				# grab inst id of selection
				# inst_id = event.target.instId

				# # set new selection, oh snap
				# selectedWidgetSrv.setSelectdId inst_id

				# # These should be updated automagically with data binding
				# $('.gameSelected').removeClass 'gameSelected'
				# $('#widget_' + $scope.selectedWidgetInstId).addClass 'gameSelected'

				# # Should this be referenced from a more proper directive? I think so
				# Materia.MyWidgets.Statistics.clearGraphs()

	# link: link
