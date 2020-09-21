describe('APIServ', () => {
	var _service
	var mockWindow
	var mockLocationSet
	var mockLocationGet
	var mockWindowEventListenr

	beforeEach(() => {
		// MOCK $window
		mockWindow = {}
		mockLocationSet = jest.fn()
		mockLocationGet = jest.fn(() => 'mock')
		Object.defineProperty(mockWindow, 'location', {
			get: mockLocationGet,
			set: mockLocationSet,
		})
		let app = angular.module('materia')
		app.factory('$window', () => mockWindow)

		require('../common/materia-namespace')
		require('./srv-api')
		inject(function (APIServ) {
			_service = APIServ
		})
	})

	it('defines expected methods', () => {
		expect(_service.showErorr).toBeDefined()
		expect(_service.filterError).toBeDefined()
	})

	it('showError redirects if error includes invalid login', () => {
		_service.showErorr({ title: 'Invalid Login' })
		expect(mockLocationSet).toHaveBeenLastCalledWith(global.BASE_URL + 'login')
	})

	it('showError does nothing when login is valid', () => {
		_service.showErorr({ title: 'nothing to do' })
		expect(mockLocationSet).not.toHaveBeenCalled()
	})

	it('filterError does nothing without an error', () => {
		_service.filterError()
		_service.filterError({ title: 'Invalid Login' })
		_service.filterError({ msg: 1 })
		_service.filterError({ type: 1 })
		expect(mockLocationSet).not.toHaveBeenCalled()
	})

	it('filterError calls showErorr', () => {
		_service.filterError()
		_service.filterError({ title: 'Invalid Login', msg: 1, type: 1 })
		expect(mockLocationSet).toHaveBeenCalled()
	})
})
