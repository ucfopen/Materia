describe('Materia.ScoreCore', () => {
	let ScoreCore

	let mockWidget
	let _onPostMessage

	beforeEach(() => {
		let app = angular.module('materia')
		global.API_LINK = 'my_api_url'
		require('../common/materia-namespace')
		require('./materia.scorecore')
		ScoreCore = Namespace('Materia').ScoreCore
		jest.spyOn(window, 'addEventListener')
		jest.spyOn(parent, 'postMessage')
		jest.spyOn(console, 'warn')

		mockWidget = {
			start: jest.fn(),
			update: jest.fn(),
			handleScoreDistribution: jest.fn(),
		}
		//prior to each test, run ScoreCore.start to prime the _onPostMessage event listener
		ScoreCore.start(mockWidget)
		parent.postMessage.mockReset()
		//this refers to the private method _onPostMessage in ScoreCore passed to window.addEventListener
		//we can use this to run private methods
		_onPostMessage = window.addEventListener.mock.calls[0][1]
	})
	afterEach(() => {
		jest.resetAllMocks()
	})

	it('defines expected public methods', () => {
		expect(ScoreCore.getMediaUrl).toBeDefined()
		expect(ScoreCore.hideResultsTable).toBeDefined()
		expect(ScoreCore.hideScoresOverview).toBeDefined()
		expect(ScoreCore.requestScoreDistribution).toBeDefined()
		expect(ScoreCore.setHeight).toBeDefined()
		expect(ScoreCore.start).toBeDefined()
	})

	it('sends a post message when starting', () => {
		ScoreCore.start(mockWidget)

		expect(parent.postMessage).toHaveBeenCalledWith(
			'{"type":"start","source":"score-core","data":null}',
			'*'
		)
		expect(window.addEventListener).toHaveBeenCalledWith('message', _onPostMessage, false)
	})

	it('sends a post message when hiding the results table', () => {
		ScoreCore.hideResultsTable()
		expect(parent.postMessage).toHaveBeenCalledWith(
			'{"type":"hideResultsTable","source":"score-core"}',
			'*'
		)
	})

	it('sends a post message when hiding the scores overview', () => {
		ScoreCore.hideScoresOverview()
		expect(parent.postMessage).toHaveBeenCalledWith(
			'{"type":"hideScoresOverview","source":"score-core"}',
			'*'
		)
	})

	it('sends a post message when requesting score distribution', () => {
		ScoreCore.requestScoreDistribution()
		expect(parent.postMessage).toHaveBeenCalledWith(
			'{"type":"requestScoreDistribution","source":"score-core"}',
			'*'
		)
	})

	it('does not send a request to set height if setHeight is given the current height', () => {
		ScoreCore.setHeight(-1)
		expect(parent.postMessage).not.toHaveBeenCalled()
	})

	it('sends a request to set height if setHeight is given the current height', () => {
		ScoreCore.setHeight(1)
		expect(parent.postMessage).toHaveBeenCalledWith(
			'{"type":"setHeight","source":"score-core","data":[1]}',
			'*'
		)
	})

	it('getMediaUrl returns an expected url', () => {
		ScoreCore.start({ start: jest.fn() })
		let _onPostMessage = window.addEventListener.mock.calls[0][1]
		_onPostMessage({
			data: JSON.stringify({
				type: 'initWidget',
				data: ['qset', 'scoreTable', 'widgetInstance', 'isPreview', 'mediaUrl'],
			}),
		})

		expect(ScoreCore.getMediaUrl('fR93X')).toBe('mediaUrl/fR93X')
	})

	it('sends a request to set height if setHeight is given nothing', () => {
		jest.spyOn(window, 'getComputedStyle').mockReturnValueOnce({ height: 10 })
		ScoreCore.setHeight()
		expect(parent.postMessage).toHaveBeenCalledWith(
			'{"type":"setHeight","source":"score-core","data":[10]}',
			'*'
		)
	})

	it('initializes the widget when receiving an "initWidget" post message', () => {
		jest.spyOn(mockWidget, 'start')
		//fake data to make sure everything is passed into the widget in the right order
		let initData = [
			{
				data: [{ qset: 'data' }],
				version: 0,
			},
			{ score: 'table' },
			{ widget: 'instance' },
			false,
		]
		_onPostMessage({
			data: JSON.stringify({
				type: 'initWidget',
				source: 'score-core',
				data: initData,
			}),
		})
		expect(mockWidget.start).toHaveBeenCalledWith(
			{ widget: 'instance' }, //instance
			[{ qset: 'data' }], //qset.data
			{ score: 'table' }, //scoreTable
			false, //isPreview
			0 //qset.version
		)
	})

	it('updates the widget when receiving an "update" post message', () => {
		jest.spyOn(mockWidget, 'update')
		//fake data to make sure everything is passed into the widget in the right order
		let updateData = [
			{
				data: [{ qset: 'updated_data' }],
				version: 0,
			},
			{ score: 'updated_table' },
		]
		_onPostMessage({
			data: JSON.stringify({
				type: 'updateWidget',
				data: updateData,
			}),
		})
		expect(mockWidget.update).toHaveBeenCalledWith(
			[{ qset: 'updated_data' }], //qset.data
			{ score: 'updated_table' }, //scoreTable
			0 //qset.version
		)
	})

	it('passes score distribution data to the widget when receiving an "update" post message', () => {
		jest.spyOn(mockWidget, 'handleScoreDistribution')
		_onPostMessage({
			data: JSON.stringify({
				type: 'scoreDistribution',
				data: [{ score: 'distribution' }],
			}),
		})
		expect(mockWidget.handleScoreDistribution).toHaveBeenCalledWith({ score: 'distribution' })
	})

	it('throws an error when receiving an unexpected post message', () => {
		_onPostMessage({
			data: JSON.stringify({
				type: 'unknownMessageType',
				data: [null],
			}),
		})

		expect(console.warn).toHaveBeenCalledWith(
			'Error: Score Core received unknown post message: unknownMessageType'
		)
	})
})
