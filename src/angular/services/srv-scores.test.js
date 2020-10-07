describe('ScoreSrv', () => {
	var _service
	var postMock
	var sendMock
	var getMock
	var $q
	var $rootScope

	let mockJsonPromiseOnce = (mock, result) => {
		mock.mockImplementationOnce((n, arg, cb) => {
			const deferred = $q.defer()
			deferred.resolve(result)
			return deferred.promise
		})
	}

	beforeEach(() => {
		require('../common/materia-namespace')
		require('./srv-scores')

		inject(function (ScoreSrv, _$q_, _$rootScope_) {
			_service = ScoreSrv
			$q = _$q_
			$rootScope = _$rootScope_
		})

		Namespace('Materia.Coms.Json').send = sendMock = jest.fn()
		Namespace('Materia.Coms.Json').post = postMock = jest.fn()
		Namespace('Materia.Coms.Json').get = getMock = jest.fn()
	})

	it('defines expected methods', () => {
		expect(_service.getWidgetInstanceScores).toBeDefined()
		expect(_service.getWidgetInstancePlayScores).toBeDefined()
		expect(_service.getGuestWidgetInstanceScores).toBeDefined()
	})

	it('getWidgetInstanceScores calls api', () => {
		let mockResults = { id: 1 }
		let myCallBack = jest.fn()
		mockJsonPromiseOnce(sendMock, mockResults)
		_service.getWidgetInstanceScores(5, 'fff', myCallBack)
		expect(sendMock).toHaveBeenLastCalledWith('widget_instance_scores_get', [5, 'fff'])
		$rootScope.$digest() // execute coms callback
		expect(myCallBack).toHaveBeenLastCalledWith(mockResults)
	})

	it('getWidgetInstancePlayScores calls api', () => {
		let mockResults = { id: 1 }
		let myCallBack = jest.fn()
		mockJsonPromiseOnce(sendMock, mockResults)
		_service.getWidgetInstancePlayScores(9, 88, myCallBack)
		expect(sendMock).toHaveBeenLastCalledWith('widget_instance_play_scores_get', [9, 88])
		$rootScope.$digest() // execute coms callback
		expect(myCallBack).toHaveBeenLastCalledWith(mockResults)
	})

	it('getGuestWidgetInstanceScores calls api', () => {
		let mockResults = { id: 1 }
		let myCallBack = jest.fn()
		mockJsonPromiseOnce(sendMock, mockResults)
		_service.getGuestWidgetInstanceScores(23, 77, myCallBack)
		expect(sendMock).toHaveBeenLastCalledWith('guest_widget_instance_scores_get', [23, 77])
		$rootScope.$digest() // execute coms callback
		expect(myCallBack).toHaveBeenLastCalledWith(mockResults)
	})
})
