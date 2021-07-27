describe('WidgetCreatorCtrl', () => {
	var $controller
	var widgetSrv
	var mockPlease
	let $scope
	let qsetToReload

	let _widgetSrv
	let _selectedWidgetSrv
	let _alert
	let _dateTimeServ

	global.window = Object.create(window)
	let url = 'materia-test/widgets/555'

	beforeEach(() => {
		mockPlease = { $apply: jest.fn() }
		let app = angular.module('materia')
		app.factory('Please', () => mockPlease)

		require('../common/materia-namespace')
		require('../common/materia-constants')
		require('../services/srv-datetime')
		require('../services/srv-widget')
		require('../services/srv-selectedwidget')
		require('./ctrl-widget-creator')

		Object.defineProperty(window, 'location', {
			value: {
				href: url,
			},
		})

		_widgetSrv = {}
		_selectedWidgetSrv = {}
		_alert = {}
		_dateTimeServ = {}

		app.factory('dateTimeServ', () => _dateTimeServ)
		app.factory('widgetSrv', () => _widgetSrv)
		app.factory('SelectedWidgetSrv', () => _selectedWidgetSrv)
		app.factory('Alert', () => _alert)

		inject((_$controller_, _widgetSrv_, _dateTimeServ_) => {
			$controller = _$controller_
		})

		$scope = {}
	})

	it('dispalys the rollback confirmation dialog after reloading', () => {
		$controller('WidgetCreatorCtrl', { $scope })

		var qset = JSON.stringify({
			items: {
				questions: [
					{
						text: 'aaa',
					},
				],
				answers: [
					{
						text: 'aaa',
						value: '100',
					},
				],
				options: {},
			},
		})

		expect($scope.showActionBar).toBe(true)
		expect($scope.showRollbackConfirmBar).toBe(false)

		Materia.Creator.onQsetHistorySelectionComplete(qset)

		expect($scope.showActionBar).toBe(false)
		expect($scope.showRollbackConfirmBar).toBe(true)
	})
})
