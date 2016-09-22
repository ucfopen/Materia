# Controller and accessory factory for Materia's modal alert dialog
app = angular.module 'materia'
app.controller 'alertCtrl', ($scope, Alert) ->
	$scope.alert = Alert
	
	$scope.reloadPage = ->
		 window.location.reload();

app.factory 'Alert', ->
	title: ''
	msg: ''
	fatal: false
	enableLoginButton: false
