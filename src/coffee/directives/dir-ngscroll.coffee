'use strict'

app = angular.module 'materia'
app.directive 'ngScroll', ->
	(scope, element, attrs) ->
		element.bind "scroll", (event) ->
			scope.$apply ->
				e = element[0]
				percent = e.scrollTop / (e.scrollHeight - e.clientHeight) * 100
				scope.$eval(attrs.ngScroll) if percent is 100
