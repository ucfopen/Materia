describe('dateValidation Directive', function () {
	let $scope
	let $compile

	beforeEach(() => {
		require('./dir-date-validation')
		inject((_$compile_, _$rootScope_) => {
			$compile = _$compile_
			$scope = _$rootScope_.$new()
		})
	})

	it('valid dates render with valid class', () => {
		$scope.sampleDate = 'date'
		let scopeApplySpy = jest.spyOn($scope, '$apply')
		let html =
			'<input type="text" ng-model="sampleDate" date-validation validate="date" value="12/12/06"/>'
		let element = angular.element(html)
		let compiled = $compile(element)($scope)
		$scope.$digest()
		expect(compiled.hasClass('ng-valid')).toBe(true)
	})

	it('replaces invalid characters for date type', () => {
		$scope.model = { sampleDate: 'initialValue' }

		let html =
			'<form name="form"><input name="mydate" type="text" ng-model="model.sampleDate" date-validation validate="date"/></form>'
		let element = angular.element(html)
		let compiled = $compile(element)($scope)
		let form = $scope.form
		form.mydate.$setViewValue('qwertyuioplkjhgfdsazxcvbnm<>?:"{}=-+_0987654321!@#$%^&*()')
		$scope.$digest()
		expect($scope.model.sampleDate).toBe('0987654321')
		expect(form.mydate.$valid).toBe(true)
	})

	it('replaces invalid characters for time type', () => {
		$scope.model = { sampleDate: 'initialValue' }

		let html =
			'<form name="form"><input name="mydate" type="text" ng-model="model.sampleDate" date-validation validate="time"/></form>'
		let element = angular.element(html)
		let compiled = $compile(element)($scope)
		let form = $scope.form
		form.mydate.$setViewValue('qwertyuioplkjhgfdsazxcvbnm<>?:"{}=-+_0987654321!@#$%^&*()')
		$scope.$digest()
		expect($scope.model.sampleDate).toBe(':0987654321')
		expect(form.mydate.$valid).toBe(true)
	})
})
