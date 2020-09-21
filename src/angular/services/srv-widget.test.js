describe('WidgetSrv', () => {
	var _service
	var $scope
	var sendMock
	var _SelectedWidgetSrv
	var _dateTimeServ
	var mockWindow
	var mockHashGet
	var mockHashSet
	var $q

	let mockSendPromiseOnce = (result) => {
		sendMock.mockImplementationOnce((n, arg, cb) => {
			const deferred = $q.defer()
			deferred.resolve(result)
			return deferred.promise
		})
	}

	beforeEach(() => {
		// MOCK some services
		_SelectedWidgetSrv = {
			set: jest.fn(),
			notifyAccessDenied: jest.fn(),
		}
		_dateTimeServ = {
			parseObjectToDateString: jest.fn(() => 'dateString'),
			parseTime: jest.fn(() => 'timeString'),
		}
		let app = angular.module('materia')
		app.factory('SelectedWidgetSrv', () => _SelectedWidgetSrv)
		app.factory('DateTimeServ', () => _dateTimeServ)

		// MOCK $window
		mockWindow = {
			addEventListener: jest.fn(),
			location: {},
		}
		mockHashGet = jest.fn()
		mockHashSet = jest.fn()
		Object.defineProperty(mockWindow.location, 'hash', {
			get: mockHashGet,
			set: mockHashSet,
		})
		app.factory('$window', () => mockWindow)

		require('../common/materia-namespace')
		require('../common/materia-constants')
		require('./srv-widget')

		inject(function (_$rootScope_, WidgetSrv, _$q_) {
			$scope = _$rootScope_
			_service = WidgetSrv
			$q = _$q_
		})

		Namespace('Materia.Coms.Json').send = sendMock = jest.fn()
		Namespace('Materia.User').getCurrentUser = getCurrentUserMock = jest.fn()
	})

	it('defines expected methods', () => {
		expect(_service.getWidgets).toBeDefined()
		expect(_service.getWidgetsByType).toBeDefined()
		expect(_service.getWidget).toBeDefined()
		expect(_service.getWidgetInfo).toBeDefined()
		expect(_service.lockWidget).toBeDefined()
		expect(_service.sortWidgets).toBeDefined()
		expect(_service.saveWidget).toBeDefined()
		expect(_service.removeWidget).toBeDefined()
		expect(_service.updateHashUrl).toBeDefined()
		expect(_service.selectWidgetFromHashUrl).toBeDefined()
		expect(_service.convertAvailibilityDates).toBeDefined()
	})

	it('getWidgets returns a promise', () => {
		mockSendPromiseOnce()
		expect(_service.getWidgets()).toHaveProperty('$$state')
	})

	it('getWidgets loads instances from api', () => {
		mockSendPromiseOnce()
		expect(_service.getWidgets()).toHaveProperty('$$state')
		expect(sendMock).toHaveBeenCalledWith('widget_instances_get', null)
	})

	it('getWidgets resolves with expected data', () => {
		mockSendPromiseOnce(getMockApiData('widget_instances_get'))

		let promiseSpy = jest.fn()
		_service.getWidgets().then(promiseSpy)
		$scope.$digest() // processes promise

		expect(promiseSpy).toHaveBeenCalled()
		expect(promiseSpy.mock.calls[0][0]).toHaveLength(49)
		expect(promiseSpy.mock.calls[0][0][0]).toHaveProperty('widget')
		expect(promiseSpy.mock.calls[0][0][0]).toHaveProperty('clean_name')
	})

	it('getWidgets caches data', () => {
		mockSendPromiseOnce(getMockApiData('widget_instances_get'))

		let promiseSpy = jest.fn()
		_service.getWidgets().then(promiseSpy)
		$scope.$digest() // processes promise

		expect(promiseSpy).toHaveBeenCalled()
		expect(promiseSpy.mock.calls[0][0]).toHaveLength(49)
		expect(sendMock).toHaveBeenCalledTimes(1)

		let promiseSpy2 = jest.fn()
		_service.getWidgets().then(promiseSpy2)
		$scope.$digest() // processes promise

		expect(promiseSpy2).toHaveBeenCalled()
		expect(sendMock).toHaveBeenCalledTimes(1)
	})

	it('getWidget returns a promise', () => {
		mockSendPromiseOnce()
		mockSendPromiseOnce()
		expect(_service.getWidget()).toHaveProperty('$$state')
		expect(_service.getWidget(55)).toHaveProperty('$$state')
	})

	it('getWidget resolves with expected data for all widgets', () => {
		mockSendPromiseOnce(getMockApiData('widget_instances_get'))

		let promiseSpy = jest.fn()
		let promiseCatch = jest.fn()
		_service.getWidget().then(promiseSpy).catch(promiseCatch)
		$scope.$digest() // processes promise

		expect(promiseSpy).not.toHaveBeenCalled()
		expect(promiseCatch).toHaveBeenCalled()
	})

	it('getWidget resolves with expected data for 1 widget', () => {
		mockSendPromiseOnce(getMockApiData('widget_instances_get'))

		let promiseSpy = jest.fn()
		_service.getWidget('avhWS').then(promiseSpy)
		$scope.$digest() // processes promise
		$scope.$digest() // processes promise

		expect(promiseSpy).toHaveBeenCalled()
		expect(promiseSpy.mock.calls[0][0]).toHaveProperty('widget')
		expect(promiseSpy.mock.calls[0][0]).toHaveProperty('clean_name')
	})

	it('getWidget caches widget data', () => {
		mockSendPromiseOnce(getMockApiData('widget_instances_get'))

		let promiseSpy = jest.fn()
		_service.getWidget('0UNM0').then(promiseSpy)
		$scope.$digest() // processes promise
		$scope.$digest() // processes promise

		expect(promiseSpy).toHaveBeenCalled()
		expect(sendMock).toHaveBeenCalledTimes(1)

		let promiseSpy2 = jest.fn()
		_service.getWidget('0UNM0').then(promiseSpy2)
		$scope.$digest() // processes promise

		expect(promiseSpy2).toHaveBeenCalled()
		expect(sendMock).toHaveBeenCalledTimes(1)
	})

	it('getWidgetInfo returns a promise', () => {
		mockSendPromiseOnce()
		expect(_service.getWidgetInfo()).toHaveProperty('$$state')
	})

	it('getWidgetInfo calls the api', () => {
		mockSendPromiseOnce()
		_service.getWidgetInfo(null)
		expect(sendMock).toHaveBeenCalledWith('widgets_get', [[null]])
		mockSendPromiseOnce()
		_service.getWidgetInfo(6)
		expect(sendMock).toHaveBeenCalledWith('widgets_get', [[6]])
	})

	it('getWidgetInfo returns widget data', () => {
		mockSendPromiseOnce(getMockApiData('widgets_get'))

		let promiseSpy = jest.fn()
		_service.getWidgetInfo().then(promiseSpy)
		$scope.$digest() // processes promise

		expect(promiseSpy).toHaveBeenCalledWith(getMockApiData('widgets_get')[0])
	})

	it('sortWidgets sorts correctly', () => {
		mockSendPromiseOnce(getMockApiData('widget_instances_get'))

		_service.getWidgets()
		$scope.$digest() // processes promise

		// join all the ids into an orderd string based on their expected order
		let finalOrder =
			'0UNM08vwnoLeHi41Ansey5o4eavhWSCECvoMUEc3l1UwKIvP3AEcgyW8FlMejrxh2Giu00yxQ0mT8ehcN99kGLQWPovZvNIi3lq4OS46SJOjDsQwe8WcrKqWujNVA8FgDglkXlQUKZRgnKnx21krR2pVaPgFL64ekd6xsSc1tQneebQg595klk72eatuhkcag88McXIm8bwgKwvOQyjGLaaQiqWmRHFsOd1BMOnmb3Yq1Same77J2'
		expect(
			_service
				.sortWidgets()
				.map((i) => i.id)
				.join('')
		).toBe(finalOrder)
	})

	it('getWidgetsByType returns a promise', () => {
		mockSendPromiseOnce()
		expect(_service.getWidgetsByType()).toHaveProperty('$$state')
	})

	it('getWidgetsByType to call the api as expected', () => {
		mockSendPromiseOnce()
		_service.getWidgetsByType('type')
		expect(sendMock).toHaveBeenCalledWith('widgets_get_by_type', ['type'])
	})

	it('getWidgetsByType returns data', () => {
		mockSendPromiseOnce('mock_result')

		let result
		_service.getWidgetsByType('type').then((d) => {
			result = d
		})
		$scope.$digest() // processes promise

		expect(result).toBe('mock_result')
	})

	it('saveWidget returns a promise', () => {
		mockSendPromiseOnce()
		expect(_service.saveWidget()).toHaveProperty('$$state')
	})

	it('saveWidget calls new instance api', () => {
		const params = {
			name: 0,
			qset: 1,
			is_draft: 2,
			open_at: 3,
			close_at: 4,
			attempts: 5,
			guest_access: 6,
			embedded_only: 7,
			widget_id: 8,
		}
		mockSendPromiseOnce()
		_service.saveWidget(params)
		expect(sendMock).toHaveBeenCalledWith('widget_instance_new', [8, 0, 1, 2])
	})

	it('saveWidget updates the saved widget in the cache', () => {
		let widgets = getMockApiData('widget_instances_get')
		mockSendPromiseOnce(widgets)
		_service.getWidgets()
		$scope.$digest() // processes promise

		let newWidget = Object.assign({}, widgets[0])
		newWidget.clean_name = 'MY NEW TEST NAME'
		newWidget.id = 'SOME_NEW_WIDGET'
		newWidget.inst_id = newWidget.id

		mockSendPromiseOnce(newWidget)
		_service.saveWidget(newWidget)

		let promiseSpy = jest.fn()
		mockSendPromiseOnce([newWidget])
		_service.getWidget(newWidget.id).then(promiseSpy)
		$scope.$digest() // processes promise

		expect(promiseSpy).toHaveBeenCalledWith(newWidget)
	})

	it('saveWidget calls update instance api', () => {
		const params = {
			name: 0,
			qset: 1,
			is_draft: 2,
			open_at: 3,
			close_at: 4,
			attempts: 5,
			guest_access: 6,
			embedded_only: 7,
			inst_id: 8,
		}
		mockSendPromiseOnce()
		_service.saveWidget(params)
		expect(sendMock).toHaveBeenCalledWith('widget_instance_update', [8, 0, 1, 2, 3, 4, 5, 6, 7])
	})

	it('saveWidget returns expected data', () => {
		mockSendPromiseOnce(getMockApiData('widget_instances_get')[4])

		let result
		_service.saveWidget('type').then((d) => {
			result = d
		})
		$scope.$digest() // processes promise

		expect(result).toBe(getMockApiData('widget_instances_get')[4])
	})

	it('removeWidget removes a widget from cache', () => {
		mockSendPromiseOnce(getMockApiData('widget_instances_get'))
		_service.getWidgets()
		$scope.$digest() // processes promise

		_service.removeWidget('0UNM0')

		let then = jest.fn()
		_service.getWidgets().then(then)
		$scope.$digest() // processes promise
		expect(then.mock.calls[0][0]).toHaveLength(48)
		expect(mockHashSet).toHaveBeenCalledWith('/8vwno')
	})

	it('removeWidget updates hash', () => {
		mockSendPromiseOnce(getMockApiData('widget_instances_get'))
		_service.getWidgets()
		$scope.$digest() // processes promise

		_service.removeWidget('0UNM0')

		_service.getWidgets()
		$scope.$digest() // processes promise

		expect(mockHashSet).toHaveBeenCalledWith('/8vwno')
	})

	it('removeWidget broadcasts event', () => {
		$scope.$broadcast = jest.fn()
		mockSendPromiseOnce(getMockApiData('widget_instances_get'))
		_service.getWidgets()
		$scope.$digest() // processes promise

		_service.removeWidget('0UNM0')

		_service.getWidgets()
		$scope.$digest() // processes promise

		expect($scope.$broadcast).toHaveBeenCalledWith('widgetList.update')
	})

	it('updateHashUrl sets url has as expected', () => {
		_service.updateHashUrl('ffgg00')
		expect(mockHashSet).toHaveBeenCalledWith('/ffgg00')
	})

	it('convertAvailibilityDates parses time when start and end are sent', () => {
		let res = _service.convertAvailibilityDates(1519232808, 1519405200)
		expect(res).toMatchObject({
			end: { date: 'dateString', time: 'timeString' },
			start: { date: 'dateString', time: 'timeString' },
		})
	})

	it('convertAvailibilityDates parses start time alone', () => {
		let res = _service.convertAvailibilityDates(1519232808)
		expect(res).toMatchObject({
			end: { date: 0, time: 0 },
			start: { date: 'dateString', time: 'timeString' },
		})
	})

	it('convertAvailibilityDates parses endtime alone', () => {
		let res = _service.convertAvailibilityDates(null, 1519232808)
		expect(res).toMatchObject({
			end: { date: 'dateString', time: 'timeString' },
			start: { date: 0, time: 0 },
		})
	})

	it('convertAvailibilityDates handles no start or end date', () => {
		let res = _service.convertAvailibilityDates()
		expect(res).toMatchObject({ end: { date: 0, time: 0 }, start: { date: 0, time: 0 } })
	})

	it('selectWidgetFromHashUrl loads widget and sets selection', () => {
		mockHashGet.mockImplementation(() => '/0UNM0')
		mockSendPromiseOnce(getMockApiData('widget_instances_get'))
		_service.selectWidgetFromHashUrl()
		$scope.$digest() // processes promise

		expect(_SelectedWidgetSrv.set).toHaveBeenCalled()
		expect(_SelectedWidgetSrv.set.mock.calls[0][0].id).toBe('0UNM0')
	})

	it('selectWidgetFromHashUrl warns about not having access', () => {
		mockHashGet.mockImplementation(() => '/ffff')
		mockSendPromiseOnce(getMockApiData('widget_instances_get'))
		_service.getWidgets()
		$scope.$digest() // processes promise

		mockSendPromiseOnce()
		_service.selectWidgetFromHashUrl()
		$scope.$digest() // processes promise
		expect(_SelectedWidgetSrv.notifyAccessDenied).toHaveBeenCalled()
	})

	it('rejects with a message when a widget is already locked', () => {
		mockSendPromiseOnce(false)

		let promiseSpy = jest.fn()
		let promiseCatch = jest.fn()
		_service.lockWidget(1).then(promiseSpy).catch(promiseCatch)
		$scope.$digest() // processes promise

		expect(Materia.Coms.Json.send).toHaveBeenCalledWith('widget_instance_lock', [1])
		expect(promiseSpy).not.toHaveBeenCalled()
		expect(promiseCatch).toHaveBeenCalledWith(
			'Someone else is editing this widget, you will be able to edit after they finish.'
		)
	})

	it('locks a widget', () => {
		mockSendPromiseOnce(true)

		let promiseSpy = jest.fn()
		let promiseCatch = jest.fn()
		_service.lockWidget(1).then(promiseSpy).catch(promiseCatch)
		$scope.$digest() // processes promise

		expect(Materia.Coms.Json.send).toHaveBeenCalledWith('widget_instance_lock', [1])
		expect(promiseSpy).toHaveBeenCalledWith(1)
		expect(promiseCatch).not.toHaveBeenCalled()
	})

	it('checks whether a widget can be published by the current user', () => {
		mockSendPromiseOnce(true)

		let promiseSpy = jest.fn()
		_service.canBePublishedByCurrentUser(1).then(promiseSpy)
		$scope.$digest() // processes promise

		expect(Materia.Coms.Json.send).toHaveBeenCalledWith('widget_publish_perms_verify', [1])
		expect(promiseSpy).toHaveBeenCalledWith(true)
	})
})
