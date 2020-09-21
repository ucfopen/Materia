// Controller and accessory factory for Materia's modal alert dialog
const app = angular.module('materia')
app.requires.push('ngModal')
app.controller('AlertCtrl', function ($scope, Alert, $window) {
	$scope.alert = Alert
	$scope.reloadPage = () => {
		$window.location.reload()
	}
})

app.factory('Alert', () => ({
	title: '',
	msg: '',
	fatal: false,
	enableLoginButton: false,
}))
