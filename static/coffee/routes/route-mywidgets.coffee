MyWidgets = angular.module 'MyWidgets'

MyWidgets.config ($locationProvider) ->
	$locationProvider.html5Mode = true