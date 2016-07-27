# Controller and accessory factory for Materia's modal alert dialog
app = angular.module 'materia'
app.controller 'alertCtrl', ($scope, Alert) ->
	$scope.alert = Alert

app.factory 'Alert', ->
	title: ''
	msg: ''
	fatal: false
