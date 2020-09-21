describe('WidgetPlayerCtrl', () => {
	let _WidgetSrv
	let _UserServ
	let _scope
	let sendMock
	let $q
	let $controller
	let $window
	let _alert
	let $timeout
	let $interval
	let $location
	let mockPlease
	const { location } = window

	let buildPostMessage = (type, data) => {
		let e = new Event('message')
		;(e.origin = 'https://crossdomain.com'),
			(e.currentTarget = 'whaaaat'),
			(e.data = JSON.stringify({
				type: type,
				data: data,
			}))
		return e
	}

	let mockSendPromiseOnce = (result) => {
		sendMock.mockImplementationOnce((n, arg, cb) => {
			const deferred = $q.defer()
			deferred.resolve(result)
			return deferred.promise
		})
	}

	let setupDomStuff = (flush = true, instance = null) => {
		let widgetInstance = instance || getMockApiData('widget_instances_get')[0]
		// mock dom elements
		let centerStyle = {
			width: -1,
			height: -1,
		}

		let widgetStyle = {
			display: 'none',
		}

		let previewStyle = {
			width: -1,
		}

		let embedStyle = {
			width: -1,
			height: -1,
		}

		let mockHref = {
			href: null,
		}

		let mockGetEl = jest
			.spyOn(document, 'getElementsByClassName')
			.mockReturnValueOnce([{ style: centerStyle }])
			.mockReturnValueOnce([{}, { style: widgetStyle }])
			.mockReturnValueOnce([{ style: previewStyle }])

		let mockPostMessageFromWidget = jest.fn()
		let mockEmbedTargetEl = {
			style: embedStyle,
			contentWindow: {
				postMessage: mockPostMessageFromWidget,
			},
		}

		// mock the getElementsById needed for the widget
		let mockGetElByID = jest
			.spyOn(document, 'getElementById')
			.mockReturnValueOnce(mockEmbedTargetEl)

		// mock createElement needed for href resolution
		let mockCreateElement = jest.spyOn(document, 'createElement').mockReturnValueOnce(mockHref)

		// mock getting the instance from the api
		_WidgetSrv.getWidget.mockImplementationOnce((inst_id) => ({
			then: jest.fn((cb) => {
				cb(widgetInstance)
			}),
		}))

		global.PLAY_ID = 'ff88gg'
		// mock question_set_get
		mockSendPromiseOnce({})

		jest.spyOn($window, 'addEventListener')

		let mockWindowAddEventListener = jest.spyOn(window, 'addEventListener')
		// start the controller
		var $scope = { $watch: jest.fn(), inst_id: 'bb8', $apply: jest.fn() }
		var controller = $controller('WidgetPlayerCtrl', { $scope })

		let mockPostMessage = $scope.jestTest.getLocalVar('_onPostMessage')

		if (flush) $timeout.flush(1) // flush the render delay timeout

		return {
			$scope,
			controller,
			mockCreateElement,
			mockPostMessageFromWidget,
			mockHref,
			embedStyle,
			previewStyle,
			widgetStyle,
			centerStyle,
			widgetInstance,
			mockGetEl,
			mockGetElByID,
			mockPostMessage,
		}
	}

	beforeEach(() => {
		delete window.location
		window.location = { assign: jest.fn() }
		mockPlease = { $apply: jest.fn() }
		let app = angular.module('materia')
		app.factory('Please', () => mockPlease)
		require('../common/materia-namespace')
		require('../common/materia-constants')

		_UserServ = { getAvatar: jest.fn(() => 'avatar') }
		_WidgetSrv = {
			getWidget: jest.fn(),
		}
		_alert = {}

		app.factory('WidgetSrv', () => _WidgetSrv)
		app.factory('UserServ', () => _UserServ)
		app.factory('Alert', () => _alert)

		require('./ctrl-widget-player')

		inject((_$window_, $rootScope, _$q_, _$controller_, _$timeout_, _$interval_, _$location_) => {
			_scope = $rootScope.$new()
			$q = _$q_
			$controller = _$controller_
			$timeout = _$timeout_
			$window = _$window_
			$interval = _$interval_
			$location = _$location_
		})

		Namespace('Materia.Coms.Json').send = sendMock = jest.fn()
		Namespace('Materia.User').getCurrentUser = getCurrentUserMock = jest.fn()
		Namespace('Materia.Image').iconUrl = jest.fn(() => 'iconurl')
	})

	afterEach(() => {
		window.location = location
		jest.clearAllMocks()
		jest.restoreAllMocks()
	})

	it('defines expected scope vars', () => {
		var $scope = { $watch: jest.fn() }
		var controller = $controller('WidgetPlayerCtrl', { $scope })

		expect($scope.isPreview).toBe(false)
		expect($scope.allowFullScreen).toBe(false)
		expect($scope.type).toBe(null)
		expect($scope.htmlPath).toBe(null)
		expect($scope.isEmbedded).toBe(false)
		expect($scope.alert).toBe(_alert)
		expect(typeof $window.onbeforeunload).toBe('function')
	})

	it('successfully sets up the dom', () => {
		let {
			$scope,
			controller,
			mockCreateElement,
			mockPostMessageFromWidget,
			mockPostMessage,
			mockHref,
			embedStyle,
			previewStyle,
			widgetStyle,
			centerStyle,
			widgetInstance,
			mockGetEl,
		} = setupDomStuff()

		// check all the widget initialization
		expect(mockPlease.$apply).toHaveBeenCalledTimes(3)
		expect(_WidgetSrv.getWidget).toHaveBeenLastCalledWith('bb8')
		expect($scope.allowFullScreen).toBe(false)
		expect(centerStyle.width).toBe('800px')
		expect(centerStyle.height).toBe('600px')
		expect(widgetStyle.display).toBe('block')
		// expect(previewStyle.width).toBe('800px')
		expect(mockHref.href).toBe('https://crossdomain.com/')
		expect($window.addEventListener).toHaveBeenCalledWith('message', expect.anything(), false)
	})

	it('doesnt start heartbeat till start is called', () => {
		let {
			$scope,
			controller,
			mockCreateElement,
			mockPostMessageFromWidget,
			mockPostMessage,
			mockHref,
			embedStyle,
			previewStyle,
			widgetStyle,
			centerStyle,
			widgetInstance,
			mockGetEl,
		} = setupDomStuff()

		// varify the heartbeat request is sent after 30 seconds of initialization
		mockSendPromiseOnce()
		$interval.flush(30000)
		expect(sendMock).not.toHaveBeenCalledWith('session_play_verify', expect.anything())
	})

	it('sends heartbeat after 30 seconds after start', () => {
		let {
			$scope,
			controller,
			mockCreateElement,
			mockPostMessageFromWidget,
			mockPostMessage,
			mockHref,
			embedStyle,
			previewStyle,
			widgetStyle,
			centerStyle,
			widgetInstance,
			mockGetEl,
		} = setupDomStuff()

		// mock widget start
		mockSendPromiseOnce('qset')
		mockSendPromiseOnce('qset')
		mockSendPromiseOnce('qset')
		mockSendPromiseOnce('qset')
		mockPostMessage(buildPostMessage('start', ''))
		_scope.$digest() // make sure defer from post message completes
		// $interval.flush(1)

		// varify the heartbeat request is sent after 30 seconds of initialization
		$interval.flush(30000)
		expect(sendMock).toHaveBeenLastCalledWith('session_play_verify', ['ff88gg'])
	})

	it('successfully adds log and storage', () => {
		let {
			$scope,
			controller,
			mockCreateElement,
			mockPostMessageFromWidget,
			mockPostMessage,
			mockHref,
			embedStyle,
			previewStyle,
			widgetStyle,
			centerStyle,
			widgetInstance,
			mockGetEl,
		} = setupDomStuff()

		// mock widget start
		mockPostMessage(buildPostMessage('start', ''))
		_scope.$digest() // make sure defer from post message completes

		// ======== test addLog
		mockPostMessage(buildPostMessage('addLog', { testLog: true, value: 10, whatever: 'yep' }))

		// add a storage log
		mockPostMessage(
			buildPostMessage('sendStorage', { testStorage: true, value: 10, whatever: 'yep' })
		)

		// force them to send now
		// mock the api request
		mockSendPromiseOnce() // once for add log
		mockSendPromiseOnce() // once for storate
		mockPostMessage(buildPostMessage('sendPendingLogs', ''))

		_scope.$digest() // make sure defer from post message completes

		let expectedStorage = expect.objectContaining([
			'ff88gg',
			[
				{
					testStorage: true,
					value: 10,
					whatever: 'yep',
				},
			],
		])

		let expectedLogs = expect.objectContaining([
			'ff88gg',
			[
				{
					game_time: expect.any(Number),
					testLog: true,
					value: 10,
					whatever: 'yep',
				},
			],
		])

		expect(sendMock).toHaveBeenCalledWith('play_storage_data_save', expectedStorage)
		expect(sendMock).toHaveBeenCalledWith('play_logs_save', expectedLogs)
	})

	it('successfully sets widget height', () => {
		let {
			$scope,
			controller,
			mockCreateElement,
			mockPostMessageFromWidget,
			mockPostMessage,
			mockHref,
			embedStyle,
			previewStyle,
			widgetStyle,
			centerStyle,
			widgetInstance,
			mockGetEl,
		} = setupDomStuff()

		// mock widget start
		mockPostMessage(buildPostMessage('start', ''))
		_scope.$digest() // make sure defer from post message completes

		// test setHeight message
		mockGetEl.mockReset()
		mockGetEl.mockReturnValue([{ style: centerStyle }])
		mockPostMessage(buildPostMessage('setHeight', [999]))

		expect(centerStyle.height).toBe('999px')

		// test min height
		mockPostMessage(buildPostMessage('setHeight', [10]))
		expect(centerStyle.height).toBe('600px')
	})

	it('successfully scrolls to a location on the page', () => {
		let {
			$scope,
			controller,
			mockCreateElement,
			mockPostMessageFromWidget,
			mockPostMessage,
			mockHref,
			embedStyle,
			previewStyle,
			widgetStyle,
			centerStyle,
			widgetInstance,
			mockGetEl,
		} = setupDomStuff()

		// mock widget start
		mockPostMessage(buildPostMessage('start', ''))
		_scope.$digest() // make sure defer from post message completes

		//
		let mockEmbedTargetEl = {
			getBoundingClientRect: jest.fn().mockReturnValueOnce({
				y: 0,
			}),
		}

		jest.spyOn(document, 'getElementById').mockReturnValueOnce(mockEmbedTargetEl)

		expect($window.scrollY).toBe(0)

		//can't always rely on window.scrollTo to be available
		jest.spyOn($window, 'scrollTo').mockImplementationOnce((x, y) => {
			return true
		})

		mockPostMessage(buildPostMessage('setVerticalScroll', [300]))
		expect($window.scrollTo).toHaveBeenCalledWith(0, 300)
	})

	it('engine core alert is handled', () => {
		let {
			$scope,
			controller,
			mockCreateElement,
			mockPostMessageFromWidget,
			mockPostMessage,
			mockHref,
			embedStyle,
			previewStyle,
			widgetStyle,
			centerStyle,
			widgetInstance,
			mockGetEl,
		} = setupDomStuff()

		// mock widget start
		mockPostMessage(buildPostMessage('start', ''))
		_scope.$digest() // make sure defer from post message completes

		// test alert post message
		mockPlease.$apply.mockClear()
		mockPostMessage(buildPostMessage('alert', { msg: 'aaaahh!' }))
		expect(mockPlease.$apply).toHaveBeenCalledTimes(1)
		expect($scope.alert.msg).toBe('aaaahh!')
		expect($scope.alert.fatal).toBe(false)
		expect($scope.alert.title).toBe('Warning!')
	})

	it('registers for window beforeunload', () => {
		let {
			$scope,
			controller,
			mockCreateElement,
			mockPostMessageFromWidget,
			mockPostMessage,
			mockHref,
			embedStyle,
			previewStyle,
			widgetStyle,
			centerStyle,
			widgetInstance,
			mockGetEl,
		} = setupDomStuff()

		// mock widget start
		mockPostMessage(buildPostMessage('start', ''))
		_scope.$digest() // make sure defer from post message completes

		// test onbeforeunload
		expect($window.onbeforeunload()).not.toBeUndefined()
		widgetInstance.widget.is_scorable = 0
		expect($window.onbeforeunload()).toBeUndefined()
		widgetInstance.widget.is_scorable = '1'
		$scope.isPreview = true
		expect($window.onbeforeunload()).toBeUndefined()
		$scope.isPreview = false
	})

	it('displays alert as expected', () => {
		let {
			$scope,
			controller,
			mockCreateElement,
			mockPostMessageFromWidget,
			mockHref,
			embedStyle,
			previewStyle,
			widgetStyle,
			centerStyle,
			widgetInstance,
			mockGetEl,
		} = setupDomStuff()

		// test alert
		mockPlease.$apply.mockClear()
		$scope.jestTest._alert('eh', 'titletext', true)
		expect(mockPlease.$apply).toHaveBeenCalledTimes(1)
		expect($scope.alert.msg).toBe('eh')
		expect($scope.alert.fatal).toBe(true)
		expect($scope.alert.title).toBe('titletext')
		mockPlease.$apply.mockClear()
		$scope.jestTest._alert('eh2')
		expect(mockPlease.$apply).toHaveBeenCalledTimes(1)
		expect($scope.alert.msg).toBe('eh2')
		expect($scope.alert.fatal).toBe(false)
		expect($scope.alert.title).toBe('Warning!')
	})

	it('successfully throws an error with a weird post message', () => {
		let {
			$scope,
			controller,
			mockCreateElement,
			mockPostMessageFromWidget,
			mockPostMessage,
			mockHref,
			embedStyle,
			previewStyle,
			widgetStyle,
			centerStyle,
			widgetInstance,
			mockGetEl,
		} = setupDomStuff()

		// test initialize post message
		expect(() => {
			mockPostMessage(buildPostMessage('initialize'))
		}).not.toThrow()
	})

	it('end causes play logs and storage to be saved', () => {
		let {
			$scope,
			controller,
			mockCreateElement,
			mockPostMessageFromWidget,
			mockPostMessage,
			mockHref,
			embedStyle,
			previewStyle,
			widgetStyle,
			centerStyle,
			widgetInstance,
			mockGetEl,
		} = setupDomStuff()

		mockSendPromiseOnce()
		mockSendPromiseOnce()
		mockPostMessage(buildPostMessage('start', ''))
		mockPostMessage(buildPostMessage('addLog', { data: 'test' }))
		mockPostMessage(buildPostMessage('sendStorage', { data: 'test' }))
		mockPostMessage(buildPostMessage('end', false))

		_scope.$digest() // make sure defer from post message completes

		expect(sendMock).toHaveBeenCalledWith('play_logs_save', expect.any(Object))
		expect(sendMock).toHaveBeenCalledWith('play_storage_data_save', expect.any(Object))
	})

	it('end redirects to score_url', () => {
		let {
			$scope,
			controller,
			mockCreateElement,
			mockPostMessageFromWidget,
			mockPostMessage,
			mockHref,
			embedStyle,
			previewStyle,
			widgetStyle,
			centerStyle,
			widgetInstance,
			mockGetEl,
		} = setupDomStuff()

		mockSendPromiseOnce({
			score_url: 'http:/localhost/score/screen/url',
			type: 'success',
		})

		mockPostMessage(buildPostMessage('start', ''))
		mockPostMessage(buildPostMessage('end'))

		_scope.$digest() // make sure defer from post message completes

		expect(window.location.assign).toHaveBeenCalledWith('http:/localhost/score/screen/url')
	})

	it('end redirects to default score url', () => {
		let {
			$scope,
			controller,
			mockCreateElement,
			mockPostMessageFromWidget,
			mockPostMessage,
			mockHref,
			embedStyle,
			previewStyle,
			widgetStyle,
			centerStyle,
			widgetInstance,
			mockGetEl,
		} = setupDomStuff()

		mockSendPromiseOnce()
		jest.spyOn($location, 'replace')

		mockPostMessage(buildPostMessage('start', ''))
		mockPostMessage(buildPostMessage('end'))

		_scope.$digest() // make sure defer from post message completes

		expect(window.location.assign).toHaveBeenCalledWith(
			'https://test_base_url.com/scores/bb8#play-ff88gg'
		)
	})

	it('end redirects to preview url', () => {
		let {
			$scope,
			controller,
			mockCreateElement,
			mockPostMessageFromWidget,
			mockPostMessage,
			mockHref,
			embedStyle,
			previewStyle,
			widgetStyle,
			centerStyle,
			widgetInstance,
			mockGetEl,
		} = setupDomStuff()

		$scope.isPreview = true
		$scope.isEmbedded = true // make sure preview prevails over isEmbedded

		mockSendPromiseOnce()
		jest.spyOn($location, 'replace')

		mockPostMessage(buildPostMessage('start', ''))
		mockPostMessage(buildPostMessage('end'))

		_scope.$digest() // make sure defer from post message completes

		expect(window.location.assign).toHaveBeenCalledWith(
			'https://test_base_url.com/scores/preview/bb8'
		)
	})

	it('end redirects to embedded url', () => {
		let {
			$scope,
			controller,
			mockCreateElement,
			mockPostMessageFromWidget,
			mockPostMessage,
			mockHref,
			embedStyle,
			previewStyle,
			widgetStyle,
			centerStyle,
			widgetInstance,
			mockGetEl,
		} = setupDomStuff()

		$scope.isEmbedded = true

		mockSendPromiseOnce()
		jest.spyOn($location, 'replace')

		mockPostMessage(buildPostMessage('start', ''))
		mockPostMessage(buildPostMessage('end'))

		_scope.$digest() // make sure defer from post message completes

		expect(window.location.assign).toHaveBeenCalledWith(
			'https://test_base_url.com/scores/embed/bb8#play-ff88gg'
		)
	})

	it('postmessage throws error when origin doesnt match', () => {
		let {
			$scope,
			controller,
			mockCreateElement,
			mockPostMessageFromWidget,
			mockHref,
			embedStyle,
			previewStyle,
			widgetStyle,
			centerStyle,
			widgetInstance,
			mockGetEl,
		} = setupDomStuff()

		expect(() => {
			$window.addEventListener.mock.calls[0][1]({
				origin: 'this-doesnt-match',
				data: JSON.stringify({
					type: 'start',
					data: '',
				}),
			})
		}).toThrow()
	})

	it('_sendAllPendingLogs shows an alert if theres an error', () => {
		let {
			$scope,
			controller,
			mockCreateElement,
			mockPostMessageFromWidget,
			mockHref,
			embedStyle,
			previewStyle,
			widgetStyle,
			centerStyle,
			widgetInstance,
			mockGetEl,
		} = setupDomStuff()

		$scope.jestTest._sendAllPendingLogs(() => {
			const deferred = $q.defer()
			deferred.reject('oh no')
			return deferred.promise
		})

		_scope.$digest() // make sure defer from post message completes

		expect($scope.alert.msg).toBe('There was a problem saving.')
		expect($scope.alert.fatal).toBe(false)
	})

	it('_onWidgetReady should reject when qset is null', () => {
		let {
			$scope,
			controller,
			mockCreateElement,
			mockPostMessageFromWidget,
			mockPostMessage,
			mockHref,
			embedStyle,
			previewStyle,
			widgetStyle,
			centerStyle,
			widgetInstance,
			mockGetEl,
		} = setupDomStuff()

		$scope.jestTest.setQset(null)
		mockPostMessage(buildPostMessage('start', ''))
		_scope.$digest() // make sure defer from post message completes

		expect($scope.jestTest.getEmbedDonePromise().promise.$$state.status).toBe(2)
	})

	it('_onWidgetReady should reject when widget is null', () => {
		let {
			$scope,
			controller,
			mockCreateElement,
			mockPostMessageFromWidget,
			mockPostMessage,
			mockHref,
			embedStyle,
			previewStyle,
			widgetStyle,
			centerStyle,
			widgetInstance,
			mockGetEl,
		} = setupDomStuff()

		$scope.jestTest.setEmbedTargetEl(null)
		mockPostMessage(buildPostMessage('start', ''))
		_scope.$digest() // make sure defer from post message completes

		expect($scope.jestTest.getEmbedDonePromise().promise.$$state.status).toBe(2)
	})

	it('end show score screen if logs are already sent', () => {
		let {
			$scope,
			controller,
			mockCreateElement,
			mockPostMessageFromWidget,
			mockPostMessage,
			mockHref,
			embedStyle,
			previewStyle,
			widgetStyle,
			centerStyle,
			widgetInstance,
			mockGetEl,
		} = setupDomStuff()

		jest.spyOn($location, 'replace')

		mockSendPromiseOnce()

		$scope.jestTest.setEndState('sent')
		mockPostMessage(buildPostMessage('start', ''))
		mockPostMessage(buildPostMessage('end'))

		_scope.$digest() // make sure defer from post message completes

		expect(window.location.assign).toHaveBeenCalledWith(expect.any(String))
	})

	it('end show score screen if logs are already sent', () => {
		let {
			$scope,
			controller,
			mockCreateElement,
			mockPostMessageFromWidget,
			mockPostMessage,
			mockHref,
			embedStyle,
			previewStyle,
			widgetStyle,
			centerStyle,
			widgetInstance,
			mockGetEl,
		} = setupDomStuff()

		jest.spyOn($location, 'replace')

		mockSendPromiseOnce()

		mockPostMessage(buildPostMessage('start', ''))
		mockPostMessage(buildPostMessage('end', false))
		expect($scope.jestTest.getLocalVar('endState')).toBe('pending')
		mockPostMessage(buildPostMessage('end', true))
		// expect($scope.jestTest.getLocalVar('endState')).toBe('pending')

		_scope.$digest() // make sure defer from post message completes

		expect(window.location.assign).toHaveBeenCalledWith(expect.any(String))
	})

	it('embeds flash correctly', () => {
		global.swfobject = {
			hasFlashPlayerVersion: jest.fn(),
			embedSWF: jest.fn(),
		}

		let {
			$scope,
			controller,
			mockCreateElement,
			mockPostMessageFromWidget,
			mockHref,
			embedStyle,
			previewStyle,
			widgetStyle,
			centerStyle,
			widgetInstance,
			mockGetEl,
		} = setupDomStuff(true, getMockApiData('widget_instances_get')[4])

		// check all the widget initialization
		expect(mockPlease.$apply).toHaveBeenCalledTimes(2)
		expect(_WidgetSrv.getWidget).toHaveBeenLastCalledWith('bb8')
		expect($scope.allowFullScreen).toBe(false)
		expect(centerStyle.width).toBe('800px')
		expect(centerStyle.height).toBe('593px')
		expect(widgetStyle.display).toBe('block')
		// expect(previewStyle.width).toBe('800px')
		expect($scope.type).toBe('flash')
		expect($window.__materia_sendStorage).toBe($scope.jestTest._sendStorage)
		expect($window.__materia_onWidgetReady).toBe($scope.jestTest._onWidgetReady)
		expect($window.__materia_sendPendingLogs).toBe($scope.jestTest._sendAllPendingLogs)
		expect($window.__materia_end).toBe($scope.jestTest._end)
		expect($window.__materia_addLog).toBe($scope.jestTest._addLog)
		expect(swfobject.embedSWF).toHaveBeenCalledWith(
			'widget_url/13-last-chance-cadet/assets/last-chance-cadet-engine.swf',
			'container',
			'100%',
			'100%',
			'10',
			'https://crossdomain.com/js/vendor/swfobject/expressInstall.swf',
			{
				GIID: 'bb8',
				URL_GET_ASSET: 'media/',
				URL_WEB: 'https://test_base_url.com/',
				inst_id: 'bb8',
			},
			{ AllowScriptAccess: 'always', allowFullScreen: 'true', menu: 'false' },
			{ id: 'container' }
		)
	})
})
