'use strict'

app = angular.module 'materia'
app.directive 'ngEnter', ->
	(scope, element, attrs) ->
		element.bind "keydown keypress", (event) ->
			if event.which == 13
				scope.$apply ->
					scope.$eval(attrs.ngEnter)
