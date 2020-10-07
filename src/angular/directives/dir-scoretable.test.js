describe('scoreTable Directive', function () {
	let $scope
	let $compile
	let $window
	let $q
	let SelectedWidgetSrv
	let data = [
		{
			id: 'one',
			time: '1519272328',
			done: '1',
			perc: '99',
			elapsed: '999',
			qset_id: '7',
			user_id: '2',
			first: 'Ian',
			last: 'Turgeon',
			username: '~author',
		},
		{
			id: 'two',
			time: '1519372329',
			done: '0',
			perc: '75',
			elapsed: '12',
			qset_id: '45',
			user_id: '5',
			first: 'Corey',
			last: 'Peterson',
			username: '~author2',
		},
	]

	beforeEach(() => {
		require('../common/materia-constants')
		require('../services/srv-selectedwidget')
		require('./dir-scoretable')

		inject(function (_$compile_, _$rootScope_, _SelectedWidgetSrv_, _$q_, _$window_) {
			SelectedWidgetSrv = _SelectedWidgetSrv_
			$compile = _$compile_
			$scope = _$rootScope_.$new()
			$q = _$q_
			$window = _$window_
		})

		let deferred = $q.defer()
		jest.spyOn(SelectedWidgetSrv, 'getSelectedId').mockImplementation(() => 6)
		jest
			.spyOn(SelectedWidgetSrv, 'getPlayLogsForSemester')
			.mockImplementation(() => deferred.promise)

		expect($scope.selectedUser).not.toBeDefined()
		expect($scope.setSelectedUser).not.toBeDefined()
		expect($scope.showScorePage).not.toBeDefined()
		expect($scope.searchStudentActivity).not.toBeDefined()
		let html = '<div score-table data-term="TERM" data-year="2015"></div>'
		let element = angular.element(html)
		let compiled = $compile(element)($scope)
		$scope.$digest()

		deferred.resolve(data)
		$scope.$apply()
	})

	it('is initialized on the element', function () {
		expect($scope.selectedUser).toBeNull()
		expect($scope.users).toMatchSnapshot()
		expect($scope.setSelectedUser).toBeDefined()
		expect($scope.showScorePage).toBeDefined()
		expect($scope.searchStudentActivity).toBeDefined()
	})

	it('setSelectedUser sets selectedUser object as expected', function () {
		expect($scope.selectedUser).toBeNull()
		$scope.setSelectedUser(5)
		expect($scope.selectedUser).toMatchSnapshot()
	})

	it('showScorePage opens the expected url', function () {
		$window.open = jest.fn()
		global.BASE_URL = 'some_url'
		$scope.showScorePage('two')
		expect($window.open).toHaveBeenLastCalledWith('some_urlscores/6/#single-two')
	})

	it('searchStudentActivity locates users', function () {
		$scope.searchStudentActivity('Ian')
		expect($scope.users).toMatchSnapshot()

		// finds neither
		$scope.searchStudentActivity('~author')
		expect($scope.users).toMatchObject({})

		$scope.searchStudentActivity('Peterson')
		expect($scope.users).toMatchSnapshot()

		// finds all
		$scope.searchStudentActivity('')
		expect($scope.users).toMatchSnapshot()
	})

	it('searchStudentActivity resets selecteUser', function () {
		$scope.setSelectedUser(5)
		expect($scope.selectedUser).toMatchSnapshot()
		$scope.searchStudentActivity('Ian')
		expect($scope.users).toMatchSnapshot()
		expect($scope.selectedUser).toBeNull()
	})
})
