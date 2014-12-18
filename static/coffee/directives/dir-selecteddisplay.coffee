'use strict'

MyWidgets = angular.module 'MyWidgets'
MyWidgets.directive 'selectedDisplay', (selectedWidgetSrv) -> # is $compile required?
	# are these required?
	# count = null
	# widgetId = null
	# instId  = null

	link = ($scope, $element, $attrs) ->
		
