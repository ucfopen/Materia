describe('scoreGraph Directive', function () {
	let $rootScope
	let $compile
	let $timeout
	let mock1 = jest.fn((cb) => {
		cb({ map: { '6': { distribution: true } } })
	})
	let mock2 = jest.fn(() => ({ then: mock1 }))
	let mock3 = jest.fn()

	beforeEach(() => {
		angular.module('materia').service('SelectedWidgetSrv', function () {
			return { getScoreSummaries: mock2 }
		})

		require('../common/materia-namespace')
		require('./dir-scoregraph.js')

		inject(function (_$compile_, _$rootScope_, _$timeout_) {
			$compile = _$compile_
			$rootScope = _$rootScope_
			$timeout = _$timeout_
		})

		Namespace('Materia.MyWidgets.Statistics').createGraph = mock3
	})

	it('is initialized on the element', function () {
		let html = '<div score-graph id="chart_6">text</div>'
		let compiled = $compile('<div score-graph id="chart_6">text</div>')($rootScope)
		$rootScope.$digest()

		expect(mock1).toHaveBeenCalledTimes(1)
		expect(mock2).toHaveBeenCalledTimes(1)
		expect(mock3).toHaveBeenCalledTimes(0)
		$timeout.flush()
		expect(mock3).toHaveBeenCalledTimes(1)
		expect(mock3).toHaveBeenCalledWith('chart_6', true)
	})
})
