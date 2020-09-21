describe('SelectedWidgetSrv', () => {
	var _service
	var _compile
	var $scope
	var sendMock
	var $q

	let mockSendPromiseOnce = (result) => {
		sendMock.mockImplementationOnce((n, arg, cb) => {
			const deferred = $q.defer()
			deferred.resolve(result)
			return deferred.promise
		})
	}

	beforeEach(() => {
		require('../common/materia-namespace')
		require('../common/materia-constants')
		require('./srv-selectedwidget')

		inject(function (_$rootScope_, SelectedWidgetSrv, _$q_) {
			$scope = _$rootScope_
			_service = SelectedWidgetSrv
			$q = _$q_
		})

		Namespace('Materia.Coms.Json').send = sendMock = jest.fn()
	})

	it('defines expected methods', () => {
		expect(_service.set).toBeDefined()
		expect(_service.get).toBeDefined()
		expect(_service.getSelectedId).toBeDefined()
		expect(_service.getScoreSummaries).toBeDefined()
		expect(_service.getUserPermissions).toBeDefined()
		expect(_service.getPlayLogsForSemester).toBeDefined()
		expect(_service.getDateRanges).toBeDefined()
		expect(_service.getSemesterFromTimestamp).toBeDefined()
		expect(_service.getStorageData).toBeDefined()
		expect(_service.getMaxRows).toBeDefined()
		expect(_service.notifyAccessDenied).toBeDefined()
	})

	it('set a widget updates result of get', () => {
		expect(_service.get()).toBeNull()
		expect(_service.set({ id: 1 })).toBeUndefined()
		expect(_service.get()).toMatchObject({ id: 1 })
	})

	it('set calls $broadcast', () => {
		$scope.$broadcast = jest.fn()
		_service.set({})
		expect($scope.$broadcast).toHaveBeenCalledWith('selectedWidget.update')
	})

	it('getSelectedId gets the widget id', () => {
		_service.set({ id: 1 })
		expect(_service.getSelectedId()).toBe(1)
		_service.set({ id: 4 })
		expect(_service.getSelectedId()).toBe(4)
	})

	it('getScoreSummaries to call api', () => {
		_service.set({ id: 5 })
		mockSendPromiseOnce()
		_service.getScoreSummaries()
		expect(sendMock).toHaveBeenCalledWith('score_summary_get', [5, true])
	})

	it('getScoreSummaries to return an angular promise', () => {
		_service.set({ id: 5 })
		mockSendPromiseOnce()
		expect(_service.getScoreSummaries()).toHaveProperty('$$state')
	})

	it('getScoreSummaries to process api results and caches them', () => {
		_service.set({ id: 5 })
		let promiseSpy = jest.fn()
		let data = [{ id: 5 }, { id: 9 }]
		mockSendPromiseOnce(data)
		_service.getScoreSummaries().then(promiseSpy)

		// execute coms callback
		$scope.$digest()

		expect(sendMock).toHaveBeenCalledTimes(1)
		expect(promiseSpy).toHaveBeenCalledWith({
			last: { id: 5 },
			list: [{ id: 5 }, { id: 9 }],
			map: { '5': { id: 5 }, '9': { id: 9 } },
		})

		let promiseSpy2 = jest.fn()
		_service.getScoreSummaries().then(promiseSpy2)
		$scope.$digest()

		expect(sendMock).toHaveBeenCalledTimes(1)
		expect(promiseSpy2).toHaveBeenCalledWith({
			last: { id: 5 },
			list: [{ id: 5 }, { id: 9 }],
			map: { '5': { id: 5 }, '9': { id: 9 } },
		})
	})

	it('getUserPermissions returns a promise', () => {
		_service.set({ id: 5 })
		mockSendPromiseOnce()
		expect(_service.getUserPermissions()).toHaveProperty('$$state')
	})

	it('getUserPermissions calls permissions_get api ', () => {
		_service.set({ id: 5 })
		mockSendPromiseOnce()
		_service.getUserPermissions()
		expect(sendMock).toHaveBeenCalledWith('permissions_get', [4, 5])
	})

	it('getUserPermissions calls permissions_get api', () => {
		_service.set({ id: 5 })
		let promiseSpy = jest.fn()
		let data = { user_perms: 4, widget_user_perms: 1 }
		mockSendPromiseOnce(data)
		_service.getUserPermissions().then(promiseSpy)
		$scope.$digest()

		expect(promiseSpy).toHaveBeenCalledWith({ user: 4, widget: 1 })
	})

	it('getPlayLogsForSemester returns a promise', () => {
		_service.set({ id: 5 })
		mockSendPromiseOnce()
		expect(_service.getPlayLogsForSemester()).toHaveProperty('$$state')
	})

	it('getPlayLogsForSemester calls play_logs_get api', () => {
		_service.set({ id: 5 })
		mockSendPromiseOnce()
		_service.getPlayLogsForSemester('term', 7)
		expect(sendMock).toHaveBeenCalledWith('play_logs_get', [5, 'term', 7])
	})

	it('getPlayLogsForSemester resolves with expected values', () => {
		_service.set({ id: 5 })

		// mock api call to semester_date_ranges_get
		mockSendPromiseOnce(getMockApiData('semester_date_ranges_get'))
		_service.getDateRanges()

		// mock api call to play_logs_get
		mockSendPromiseOnce(getMockApiData('play_logs_get'))
		$scope.$digest()

		// call the function
		let promiseSpy = jest.fn()
		_service.getPlayLogsForSemester('Fall', 2016).then(promiseSpy)
		$scope.$digest()

		// all of play_logs_get mock content is in Fall of 2016
		expect(promiseSpy).toHaveBeenCalledWith(getMockApiData('play_logs_get'))

		// now try to get another semester that should be empty
		let promiseSpy2 = jest.fn()
		mockSendPromiseOnce(getMockApiData('play_logs_get'))
		_service.getPlayLogsForSemester('Summer', 2016).then(promiseSpy2)
		$scope.$digest()

		expect(promiseSpy2).toHaveBeenCalledWith([])
	})

	it('getDateRanges returns a promise', () => {
		_service.set({ id: 5 })
		mockSendPromiseOnce()
		expect(_service.getDateRanges()).toHaveProperty('$$state')
	})

	it('getDateRanges calls semester_date_ranges_get api', () => {
		_service.set({ id: 5 })
		mockSendPromiseOnce()
		_service.getDateRanges()
		expect(sendMock).toHaveBeenCalledWith('semester_date_ranges_get', [])
	})

	it('getDateRanges caches dates', () => {
		_service.set({ id: 5 })

		// mock results from semester_date_ranges_get api
		mockSendPromiseOnce(getMockApiData('semester_date_ranges_get'))
		_service.getDateRanges()
		$scope.$digest()

		expect(sendMock).toHaveBeenCalledTimes(1)

		// clear mock, expecting the function to use data from cache
		sendMock.mockClear()
		mockSendPromiseOnce()
		_service.getDateRanges()
		$scope.$digest()
		expect(sendMock).toHaveBeenCalledTimes(0)
	})

	it('getDateRanges returns expected data', () => {
		_service.set({ id: 5 })

		// mock results from semester_date_ranges_get api
		mockSendPromiseOnce(getMockApiData('semester_date_ranges_get'))

		let promiseSpy = jest.fn()
		_service.getDateRanges().then(promiseSpy)
		$scope.$digest()

		expect(promiseSpy).toHaveBeenCalledWith(getMockApiData('semester_date_ranges_get'))
	})

	it('getSemesterFromTimestamp returns undefined if not found', () => {
		_service.set({ id: 5 })
		// mock results from semester_date_ranges_get api
		mockSendPromiseOnce(getMockApiData('semester_date_ranges_get'))
		_service.getDateRanges()
		$scope.$digest()

		expect(_service.getSemesterFromTimestamp(99)).toBeUndefined()
	})

	it('getSemesterFromTimestamp returns the matching semester', () => {
		_service.set({ id: 5 })
		// mock results from semester_date_ranges_get api
		mockSendPromiseOnce(getMockApiData('semester_date_ranges_get'))
		_service.getDateRanges()
		$scope.$digest()

		let expectedSemseterA = {
			year: '2016',
			semester: 'Summer',
			start: '1462233601',
			end: '1470528000',
		}

		let expectedSemseterB = {
			year: '2028',
			semester: 'Summer',
			start: '1840939201',
			end: '1849233600',
		}

		let semsterA = _service.getSemesterFromTimestamp(1462233601)
		expect(semsterA).toMatchObject(expectedSemseterA)

		let semsterA2 = _service.getSemesterFromTimestamp(1470528000)
		expect(semsterA2).toMatchObject(expectedSemseterA)

		let semsterB = _service.getSemesterFromTimestamp(1840939299)
		expect(semsterB).toMatchObject(expectedSemseterB)

		let semsterNone = _service.getSemesterFromTimestamp(67)
		expect(semsterNone).toBeUndefined()
	})

	it('getStorageData returns a promise', () => {
		_service.set({ id: 5 })
		mockSendPromiseOnce()
		expect(_service.getStorageData()).toHaveProperty('$$state')
	})

	it('getStorageData calls = api', () => {
		_service.set({ id: 5 })
		mockSendPromiseOnce()
		_service.getStorageData()
		expect(sendMock).toHaveBeenCalledWith('play_storage_get', [5])
	})

	it('getStorageData returns the expected data', () => {
		_service.set({ id: 5 })
		mockSendPromiseOnce(getMockApiData('semester_date_ranges_get'))
		_service.getDateRanges()

		mockSendPromiseOnce(getMockApiData('play_storage_get'))

		let promiseSpy = jest.fn()
		_service.getStorageData().then(promiseSpy)
		$scope.$digest()

		expect(promiseSpy).toHaveBeenCalled()
		let result = promiseSpy.mock.calls[0][0]

		expect(result).toHaveProperty('2016 fall')
		expect(result).toHaveProperty('2002 summer')

		expect(result['2016 fall']).toHaveProperty('SomeExampleTable')
		expect(result['2016 fall']['SomeExampleTable']).toHaveProperty('data')
		expect(result['2016 fall']['SomeExampleTable']).toHaveProperty('truncated')
		expect(result['2016 fall']['SomeExampleTable']['data'][0]).toHaveProperty('data')
		expect(result['2016 fall']['SomeExampleTable']['data'][0]).toHaveProperty('play')

		expect(result['2016 fall']).toHaveProperty('SomeOtherTable')
		expect(result['2016 fall']['SomeOtherTable']).toHaveProperty('data')
		expect(result['2016 fall']['SomeOtherTable']).toHaveProperty('truncated')
		expect(result['2016 fall']['SomeOtherTable']['data'][0]).toHaveProperty('data')
		expect(result['2016 fall']['SomeOtherTable']['data'][0]).toHaveProperty('play')

		expect(result['2002 summer']).toHaveProperty('SomeExampleTable')
		expect(result['2002 summer']['SomeExampleTable']).toHaveProperty('data')
		expect(result['2002 summer']['SomeExampleTable']).toHaveProperty('truncated')
		expect(result['2002 summer']['SomeExampleTable']['data'][0]).toHaveProperty('data')
		expect(result['2002 summer']['SomeExampleTable']['data'][0]).toHaveProperty('play')

		expect(result['2002 summer']).not.toHaveProperty('SomeOtherTable')
	})

	it('getMaxRows returns expected value', () => {
		expect(_service.getMaxRows()).toBe(100)
	})

	it('notifyAccessDenied calls $broadcast', () => {
		$scope.$broadcast = jest.fn()
		_service.notifyAccessDenied()
		expect($scope.$broadcast).toHaveBeenCalledWith('selectedWidget.notifyAccessDenied')
	})
})
