describe('datatable Directive', function () {
	let $scope
	let $compile
	let $timeout
	let DataTable = jest.fn()

	beforeEach(() => {
		require('./dir-datatable')
		inject((_$compile_, _$rootScope_, _$timeout_) => {
			$compile = _$compile_
			$scope = _$rootScope_.$new()
			$timeout = _$timeout_
		})

		// mock jquery and fancybox plugin
		global.$ = jest.fn(() => ({ DataTable }))
	})

	it('is initialized on the element', () => {
		let scopeApplySpy = jest.spyOn($scope, '$apply')
		let html = '<div datatable>text</div>'
		let element = angular.element(html)
		let compiled = $compile(element)($scope)
		$scope.$digest()

		expect(compiled.html()).toBe('text')
		expect(DataTable).toHaveBeenCalledTimes(0)
		expect(global.$).toHaveBeenCalledTimes(0)
		$timeout.flush()
		expect(DataTable).toHaveBeenCalledTimes(1)
		expect(global.$).toHaveBeenCalledTimes(1)
	})
})
