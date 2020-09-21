const app = angular.module('materia')
app.service('Please', function ($rootScope) {
	return {
		$apply: () => {
			if (!$rootScope.$$phase) $rootScope.$apply()
		},
	}
})
