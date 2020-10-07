describe('enginecore', () => {
	let Engine
	let $q

	let mockFetchOnce = (result) => {
		fetch.mockImplementationOnce((n, arg, cb) => {
			const deferred = $q.defer()
			deferred.resolve(result)
			return deferred.promise
		})
	}

	beforeEach(() => {
		let app = angular.module('materia')
		inject(function (_$q_) {
			$q = _$q_
		})
		global.API_LINK = 'my_api_url'
		require('../common/materia-namespace')
		require('./materia.enginecore')
		Engine = Namespace('Materia').Engine
		global.fetch = jest.fn()
		jest.spyOn(window, 'addEventListener')
		jest.spyOn(parent, 'postMessage')
	})

	it('defines expected public methods', () => {
		expect(Engine.start).toBeDefined()
		expect(Engine.addLog).toBeDefined()
		expect(Engine.alert).toBeDefined()
		expect(Engine.getImageAssetUrl).toBeDefined()
		expect(Engine.end).toBeDefined()
		expect(Engine.sendPendingLogs).toBeDefined()
		expect(Engine.sendStorage).toBeDefined()
		expect(Engine.disableResizeInterval).toBeDefined()
		expect(Engine.setHeight).toBeDefined()
		expect(Engine.setVerticalScroll).toBeDefined()
		expect(Engine.escapeScriptTags).toBeDefined()
	})

	it('start sends a postmessage', () => {
		Engine.start({})
		expect(parent.postMessage).toHaveBeenCalledWith('{"type":"initialize"}', '*')
		expect(parent.postMessage).toHaveBeenCalledWith('{"type":"start","data":null}', '*')
	})

	it('addLog sends a postmessage', () => {
		Engine.addLog('logtype', 'id', 'text', 'value')
		expect(parent.postMessage).toHaveBeenLastCalledWith(
			'{"type":"addLog","data":{"type":"logtype","item_id":"id","text":"text","value":"value"}}',
			'*'
		)

		Engine.addLog('logtype')
		expect(parent.postMessage).toHaveBeenLastCalledWith(
			'{"type":"addLog","data":{"type":"logtype","item_id":0,"text":""}}',
			'*'
		)
	})

	it('addLog deals with missing args', () => {
		Engine.addLog('logtype')
		expect(parent.postMessage).toHaveBeenLastCalledWith(
			'{"type":"addLog","data":{"type":"logtype","item_id":0,"text":""}}',
			'*'
		)
	})

	it('alert sends a postmessage', () => {
		Engine.alert('title', 'msg', 'fatal')
		expect(parent.postMessage).toHaveBeenCalledWith(
			'{"type":"alert","data":{"title":"title","msg":"msg","fatal":"fatal"}}',
			'*'
		)
	})

	// deprecated funtion, test to check that it functions for old widgets that use it
	it('getImageAssetUrl returns an expected url', () => {
		Engine.start({ start: jest.fn() })
		let _onPostMessage = window.addEventListener.mock.calls[0][1]
		_onPostMessage({
			data: JSON.stringify({
				type: 'initWidget',
				data: ['qset', 'instance', 'baseUrl', 'mediaUrl'],
			}),
		})

		expect(Engine.getImageAssetUrl('fR93X')).toBe('mediaUrl/fR93X')
	})

	it('getMediaUrl returns an expected url', () => {
		Engine.start({ start: jest.fn() })
		let _onPostMessage = window.addEventListener.mock.calls[0][1]
		_onPostMessage({
			data: JSON.stringify({
				type: 'initWidget',
				data: ['qset', 'instance', 'baseUrl', 'mediaUrl'],
			}),
		})

		expect(Engine.getMediaUrl('fR93X')).toBe('mediaUrl/fR93X')
	})

	it('reacts properly to post messages with non-string data', () => {
		Engine.start({ start: jest.fn() })
		let _onPostMessage = window.addEventListener.mock.calls[0][1]
		_onPostMessage({
			data: undefined,
		})
		expect(parent.postMessage).toHaveLastReturnedWith(undefined)
	})

	it('end sends post message and defaults to show score screen', () => {
		Engine.end()
		let ex = JSON.stringify({
			type: 'end',
			data: true,
		})
		expect(parent.postMessage).toHaveBeenLastCalledWith(ex, '*')
	})

	it('end sends post message with show score screen set to false', () => {
		Engine.end(false)
		let ex = JSON.stringify({
			type: 'end',
			data: false,
		})
		expect(parent.postMessage).toHaveBeenLastCalledWith(ex, '*')
	})

	it('sendPendingLogs sends post message', () => {
		Engine.sendPendingLogs()
		let ex = JSON.stringify({
			type: 'sendPendingLogs',
			data: {},
		})
		expect(parent.postMessage).toHaveBeenLastCalledWith(ex, '*')
	})

	it('sendStorage sends post message', () => {
		Engine.sendStorage('message')
		let ex = JSON.stringify({
			type: 'sendStorage',
			data: 'message',
		})
		expect(parent.postMessage).toHaveBeenLastCalledWith(ex, '*')
	})

	it('setHeight sends message', () => {
		Engine.setHeight(200)
		let ex = JSON.stringify({
			type: 'setHeight',
			data: [200],
		})
		expect(parent.postMessage).toHaveBeenLastCalledWith(ex, '*')
	})

	it('setVerticalScroll sends message', () => {
		Engine.setVerticalScroll(0)
		let ex = JSON.stringify({
			type: 'setVerticalScroll',
			data: [0],
		})
		expect(parent.postMessage).toHaveBeenLastCalledWith(ex, '*')
	})

	it('escapeScriptTags cleans tags', () => {
		let ret = Engine.escapeScriptTags('<script><a href="test">hi</a></script>')
		expect(ret).toBe('&lt;script&gt;&lt;a href="test"&gt;hi&lt;/a&gt;&lt;/script&gt;')
	})
})
