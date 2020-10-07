describe('scoreData Directive', function () {
	let $scope
	let $compile
	let $q
	let $SelectedWidgetSrv

	beforeEach(() => {
		require('../common/materia-constants')
		require('../services/srv-selectedwidget')
		require('./dir-scoredata.js')

		inject(function (_$compile_, _$rootScope_, _SelectedWidgetSrv_, _$q_) {
			$SelectedWidgetSrv = _SelectedWidgetSrv_
			$compile = _$compile_
			$scope = _$rootScope_.$new()
			$q = _$q_
		})
	})

	it('is initialized on the element', function () {
		let data = { '2050 Summer': { table1: null, table2: null } }

		let deferred = $q.defer()
		jest.spyOn($SelectedWidgetSrv, 'getStorageData').mockImplementation(() => deferred.promise)

		jest.spyOn($SelectedWidgetSrv, 'getMaxRows').mockImplementation(() => 777)

		let html = '<div score-data id="data_66" data-semester="2050 Summer" data-has-storage="true" >'
		let element = angular.element(html)
		let compiled = $compile(element)($scope)
		$scope.$digest()

		deferred.resolve(data)
		$scope.$apply()

		expect($scope.tables).toMatchObject({ table1: null, table2: null })
		expect($scope.MAX_ROWS).toBe(777)
		expect($scope.tableNames).toMatchObject(['table1', 'table2'])
		expect($scope.selectedTable).toBe('table1')
	})

	it('is short circuited when there is no storage', function () {
		let html = '<div score-data id="data_66" data-semester="2050 Summer" data-has-storage="false" >'
		let element = angular.element(html)
		let compiled = $compile(element)($scope)
		$scope.$digest()
		$scope.$apply()

		expect($scope.tables).not.toBeDefined()
		expect($scope.MAX_ROWS).not.toBeDefined()
		expect($scope.tableNames).not.toBeDefined()
		expect($scope.selectedTable).not.toBeDefined()
	})
})
