describe('ngEnter Directive', function () {
	let $scope
	let $compile

	beforeEach(() => {
		require('./dir-ngenter')
		inject((_$compile_, _$rootScope_) => {
			$compile = _$compile_
			$scope = _$rootScope_.$new()
		})
	})

	it('executes callback on enter key', () => {
		$scope.enterHandler = jest.fn()
		var element = angular.element('<div class="okyea" ng-enter="enterHandler()">test</div>')
		var compiled = $compile(element)($scope)
		$scope.$digest()

		expect(compiled.html()).toBe('test')
		expect($scope.enterHandler).not.toHaveBeenCalled()
		compiled.triggerHandler({ type: 'keydown', which: 13 })
		compiled.triggerHandler({ type: 'keypress', which: 13 })
		expect($scope.enterHandler).toHaveBeenCalledTimes(2)
	})
})
