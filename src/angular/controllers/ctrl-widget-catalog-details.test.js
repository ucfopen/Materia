describe('WidgetCatalogDetailsController', () => {
	var $controller
	var mockPlease
	var $q
	var $rootScope
	var $scope
	var $document
	var $window
	var $timeout
	var location
	var sendMock
	var iconUrlMock
	var screenshotUrlMock
	var screenshotThumbMock
	var widgetPromise
	var getWidthMock

	const baseWidget = {
		name: 'hi',
		meta_data: {
			subheader: 'subheader',
			about: 'about',
			supported_data: ['supported1', 'supported2'],
			features: ['feature1', 'feature2'],
			demo: 'abCD1',
		},
		width: '700',
		height: '700',
	}

	beforeEach(() => {
		mockPlease = { $apply: jest.fn() }
		let app = angular.module('materia')
		app.factory('Please', () => mockPlease)

		// mock window.location
		mockWindow = {}
		mockLocationSet = jest.fn((l) => (location = l))
		mockLocationGet = jest.fn(() => location)
		Object.defineProperty(mockWindow, 'location', {
			get: mockLocationGet,
			set: mockLocationSet,
		})
		app.factory('$window', () => mockWindow)

		document.body.innerHTML += `
			<div id="pics-scroller-container">
				<div id="pics-scroller">
				</div>
			</div>
		`

		require('../common/materia-namespace')
		require('../common/materia-constants')
		require('../materia/materia.coms.json')
		require('../services/srv-selectedwidget')
		require('../services/srv-datetime')
		require('../services/srv-widget')
		require('ngmodal/dist/ng-modal')
		require('hammerjs')
		require('./ctrl-widget-catalog-details')

		inject((_$controller_, _$document_, _$window_, _$timeout_, _$q_, _$rootScope_) => {
			$controller = _$controller_
			$document = _$document_
			$window = _$window_
			$timeout = _$timeout_
			$q = _$q_
			$rootScope = _$rootScope_
		})

		widgetPromise = $q.defer()

		Namespace('Materia.Coms.Json').send = sendMock = jest.fn(() => {
			return widgetPromise.promise
		})

		Namespace('Materia.Image').iconUrl = iconUrlMock = jest.fn(() => {
			const deferred = $q.defer()
			deferred.resolve('widget.jpg')
			return deferred.promise
		})

		Namespace('Materia.Image').screenshotUrl = screenshotUrlMock = jest.fn(() => {
			const deferred = $q.defer()
			deferred.resolve('screenshot-full.jpg')
			return deferred.promise
		})

		Namespace('Materia.Image').screenshotThumbUrl = screenshotThumbMock = jest.fn(() => {
			const deferred = $q.defer()
			deferred.resolve('screenshot-thumb.jpg')
			return deferred.promise
		})

		$scope = {
			$watch: jest.fn(),
			$on: jest.fn(),
		}

		var controller = $controller('WidgetCatalogDetailsController', { $scope })
	})

	const setup = (customWidget = false, pageWidth = 1000) => {
		const widget = customWidget || baseWidget
		widgetPromise.resolve([widget])
		$timeout.flush()

		getWidthMock = jest.spyOn($scope, 'getWidth')
		getWidthMock.mockReturnValue(pageWidth)
	}

	const mockSessionCreate = () => {
		return (Namespace('Materia.Coms.Json').send = jest.fn(() => {
			return {
				then: (cb) => cb('play-id'),
			}
		}))
	}

	it('defines expected scope vars', () => {
		setup()
		expect($scope.widget).toBeDefined()
		expect($scope.widget.icon).toBeDefined()
		expect($scope.showDemoCover).toBe(true)
		expect($scope.selectedImage).toBe(0)
		expect($scope.showDemoClicked).toBeDefined()
		expect($scope.selectImage).toBeDefined()
		expect($scope.nextImage).toBeDefined()
		expect($scope.prevImage).toBeDefined()
	})

	it('will load the demo inline if the page is wide enough', () => {
		setup()
		const sessionCreateMock = mockSessionCreate()

		$scope.showDemoCover = false
		$scope.showDemoClicked()

		expect($scope.demoWidth).toBe('710px')
		expect($scope.demoHeight).toBe('748px')
		expect($scope.showDemoCover).toBe(false)
	})

	it('will redirect to the demo if the page is not wide enough', () => {
		// pretend the page width is 300px
		setup(false, 300)

		$scope.showDemoCover = false
		const url = 'localhost/widget-demo'
		$scope.widget.demourl = url

		$scope.showDemoClicked()

		expect($window.location).toBe(url)
		expect($scope.showDemoCover).toBe(false)
	})

	it('will always open a resizable demo as a new page', () => {
		let customWidget = JSON.parse(JSON.stringify(baseWidget))
		customWidget.width = 0
		setup(customWidget)

		// set the widget to have a width of 0, meaning that it is resizable
		$scope.widget.width = 0
		$scope.showDemoCover = false
		const url = ($scope.widget.demourl = 'localhost/widget-demo')

		$scope.showDemoClicked()

		expect($window.location).toBe(url)
		expect($scope.showDemoCover).toBe(false)
	})

	it('will remove the unload event if the inline demo adds one', () => {
		setup()
		const sessionCreateMock = mockSessionCreate()

		expect($scope.showDemoCover).toBe(true)
		$scope.showDemoClicked()
		$timeout.flush()
		expect($scope.showDemoCover).toBe(false)

		expect($window.onbeforeunload()).toBe(undefined)
	})

	it('will go to the next image properly', () => {
		setup()
		expect($scope.selectedImage).toBe(0)
		$scope.nextImage()
		expect($scope.selectedImage).toBe(1)
		$scope.nextImage()
		expect($scope.selectedImage).toBe(2)
		$scope.nextImage()
		expect($scope.selectedImage).toBe(3)
		$scope.nextImage()
		expect($scope.selectedImage).toBe(0)
	})

	it('will go to the previous image properly', () => {
		setup()
		expect($scope.selectedImage).toBe(0)
		$scope.prevImage()
		expect($scope.selectedImage).toBe(3)
		$scope.prevImage()
		expect($scope.selectedImage).toBe(2)
		$scope.prevImage()
		expect($scope.selectedImage).toBe(1)
		$scope.prevImage()
		expect($scope.selectedImage).toBe(0)
	})

	it('can jump to a specific image', () => {
		setup()
		expect($scope.selectedImage).toBe(0)
		$scope.selectImage(3)
		expect($scope.selectedImage).toBe(3)
	})

	it('will properly set the about section for a widget without one', () => {
		let customWidget = JSON.parse(JSON.stringify(baseWidget))
		customWidget.meta_data.about = ''
		setup(customWidget)
		expect($scope.widget.about).toBe('No description available.')
	})

	it('defines inst_id for the embedded demo', () => {
		// the embedded demo (ctrl-player.js) relies on $scope.inst_id to get the qset
		setup()
		expect($scope.inst_id).toBe('abCD1')
	})

	it('gets a play-id only when the demo is stared', () => {
		setup()
		const sessionCreateMock = mockSessionCreate()

		$scope.showDemoClicked()

		// player expects PLAY_ID var to be defined
		expect($window.PLAY_ID).toBe('play-id')
		expect(sessionCreateMock).toHaveBeenCalledTimes(1)
		expect(sessionCreateMock).toHaveBeenCalledWith('session_play_create', ['abCD1'])
	})
})
