const app = angular.module('materia')
app.directive('fileOnChange', () => ({
	restrict: 'A',
	link(scope, element, attrs) {
		const onChangeHandler = scope.$eval(attrs.fileOnChange)
		element.bind('change', onChangeHandler)
		element.bind('drop', onChangeHandler)
	},
}))
