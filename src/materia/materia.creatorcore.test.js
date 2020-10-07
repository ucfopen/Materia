describe('creatorcore', () => {
	let creatorCore
	let $q
	let mockCreator
	let _onPostMessage

	const mockHeightGetter = () => {
		//mocks document.getElementsByTagName('tag')[0].height()
		jest.spyOn(document, 'getElementsByTagName').mockReturnValueOnce([{ height: () => 10 }])
	}

	//iterates all mocked creator methods to ensure only the target method is called
	const expectOnlyCreatorMethodCalledToBe = (targetMethod) => {
		Object.keys(mockCreator).forEach((method) => {
			if (method == targetMethod) {
				expect(mockCreator[method]).toHaveBeenCalledTimes(1)
			} else {
				expect(mockCreator[method]).not.toHaveBeenCalled()
			}
		})
	}

	const mockPostMessageFromWidget = (type, source, data) => {
		let payload = JSON.stringify({
			type: type,
			source: source,
			data: data,
		})
		_onPostMessage({
			data: payload,
		})
		return payload
	}

	const mockCreatorCoreAlert = (message) =>
		JSON.stringify({
			type: 'alert',
			source: 'creator-core',
			data: {
				msg: message,
				title: null,
				fatal: false,
			},
		})

	beforeEach(() => {
		jest.spyOn(console, 'warn')
		console.warn.mockReturnValue()
		let app = angular.module('materia')
		inject(function (_$q_) {
			$q = _$q_
		})
		global.API_LINK = 'my_api_url'
		require('../common/materia-namespace')
		require('./materia.creatorcore')
		creatorCore = Namespace('Materia.CreatorCore')
		global.fetch = jest.fn()
		jest.spyOn(window, 'addEventListener')
		jest.spyOn(parent, 'postMessage')

		mockCreator = {
			onSaveClicked: jest.fn(),
			onSaveComplete: jest.fn(),
			onMediaImportComplete: jest.fn(),
			onQuestionImportComplete: jest.fn(),
			initNewWidget: jest.fn(),
			initExistingWidget: jest.fn(),
		}

		//prior to each test, run creatorCore.start to prime the _onPostMessage event listener
		creatorCore.start(mockCreator)
		parent.postMessage.mockReset()
		//this refers to the private method _onPostMessage passed to window.addEventListener
		//use this to run private methods
		_onPostMessage = window.addEventListener.mock.calls[0][1]
	})

	afterEach(() => {
		jest.resetAllMocks()
	})

	it('defines expected public methods', () => {
		expect(creatorCore.start).toBeDefined()
		expect(creatorCore.alert).toBeDefined()
		expect(creatorCore.getMediaUrl).toBeDefined()
		expect(creatorCore.showMediaImporter).toBeDefined()
		expect(creatorCore.cancelSave).toBeDefined()
		expect(creatorCore.save).toBeDefined()
		expect(creatorCore.disableResizeInterval).toBeDefined()
		expect(creatorCore.setHeight).toBeDefined()
		expect(creatorCore.escapeScriptTags).toBeDefined()
	})

	it('start sends a postmessage', () => {
		creatorCore.start({})
		expect(parent.postMessage).toHaveBeenCalledWith(
			'{"type":"start","source":"creator-core","data":null}',
			'*'
		)
	})

	it('reacts properly to initNewWidget post messages', () => {
		mockPostMessageFromWidget('initNewWidget', 'creator-core', ['widgetObj', 'baseUrl', 'mediaUrl'])

		expect(mockCreator.initNewWidget).toHaveBeenCalledWith('widgetObj')
		expectOnlyCreatorMethodCalledToBe('initNewWidget')
	})

	it('reacts properly to initExistingWidget post messages', () => {
		mockPostMessageFromWidget('initExistingWidget', 'creator-core', [
			'widgetObj',
			'widgetTitle',
			'qsetObj',
			'qsetVersion',
			'baseUrl',
			'mediaUrl',
		])
		expect(mockCreator.initExistingWidget).toHaveBeenCalledWith(
			'widgetObj',
			'widgetTitle',
			'qsetObj',
			'qsetVersion'
		)
		expectOnlyCreatorMethodCalledToBe('initExistingWidget')
	})

	it('reacts properly to onRequestSave post messages', () => {
		mockPostMessageFromWidget('onRequestSave', 'creator-core', ['save'])

		expect(mockCreator.onSaveClicked).toHaveBeenCalledWith('save')
		expectOnlyCreatorMethodCalledToBe('onSaveClicked')
	})

	it('reacts properly to onSaveComplete post messages', () => {
		let payload = ['instanceName', 'instanceWidget', 'instanceQsetData', 'instanceQsetVersion']
		mockPostMessageFromWidget('onSaveComplete', 'creator-core', payload)

		expect(mockCreator.onSaveComplete).toHaveBeenCalledWith(...payload)
		expectOnlyCreatorMethodCalledToBe('onSaveComplete')
	})

	it('reacts properly to onMediaImportComplete post messages', () => {
		mockPostMessageFromWidget('onMediaImportComplete', 'creator-core', ['mediaArray'])

		expect(mockCreator.onMediaImportComplete).toHaveBeenCalledWith('mediaArray')
		expectOnlyCreatorMethodCalledToBe('onMediaImportComplete')
	})

	it('reacts properly to onQuestionImportComplete post messages', () => {
		mockPostMessageFromWidget('onQuestionImportComplete', 'creator-core', ['questionArray'])

		expect(mockCreator.onQuestionImportComplete).toHaveBeenCalledWith('questionArray')
		expectOnlyCreatorMethodCalledToBe('onQuestionImportComplete')
	})

	it('reacts properly to post messages with non-string data', () => {
		mockPostMessageFromWidget('', '', undefined)
		expect(window.addEventListener).toHaveLastReturnedWith(undefined)
	})

	it('reacts properly to unknown post messages', () => {
		mockPostMessageFromWidget('undefinedMessageType', 'unknown-source', ['payload'])
		expect(console.warn).toHaveBeenCalledWith(
			'Error, unknown message sent to creator core: undefinedMessageType'
		)
	})

	it('reacts properly if the creator class is missing an expected method', () => {
		//pretend the creator doesn't have this method defined after all
		delete mockCreator.initNewWidget

		_onPostMessage({
			data: JSON.stringify({
				type: 'initNewWidget',
				data: ['widgetObj', 'baseUrl', 'mediaUrl'],
			}),
		})
		expect(parent.postMessage).toHaveBeenCalledWith(
			mockCreatorCoreAlert('Error, missing creator initNewWidget called.'),
			'*'
		)
	})

	it('alert sends a postmessage', () => {
		creatorCore.alert('msg', 'title', 'fatal')
		expect(parent.postMessage).toHaveBeenCalledWith(
			'{"type":"alert","source":"creator-core","data":{"msg":"msg","title":"title","fatal":"fatal"}}',
			'*'
		)
	})

	it('getMediaUrl returns an expected url', () => {
		mockPostMessageFromWidget('initNewWidget', 'creator-core', ['widgetObj', 'baseUrl', 'mediaUrl'])
		expect(creatorCore.getMediaUrl('fR93X')).toBe('mediaUrl/fR93X')
	})

	it('showMediaImporter sends post message', () => {
		creatorCore.showMediaImporter()
		let ex = JSON.stringify({
			type: 'showMediaImporter',
			source: 'creator-core',
			data: ['image'],
		})
		expect(parent.postMessage).toHaveBeenLastCalledWith(ex, '*')
	})

	it('showMediaImporter sends post message with media specified', () => {
		creatorCore.showMediaImporter(['mp3'])
		let ex = JSON.stringify({
			type: 'showMediaImporter',
			source: 'creator-core',
			data: ['mp3'],
		})
		expect(parent.postMessage).toHaveBeenLastCalledWith(ex, '*')
	})

	it('cancelSave sends post message', () => {
		creatorCore.cancelSave('message')
		let ex = JSON.stringify({
			type: 'cancelSave',
			source: 'creator-core',
			data: ['message'],
		})
		expect(parent.postMessage).toHaveBeenLastCalledWith(ex, '*')
	})

	it('save sends post message', () => {
		creatorCore.save('title', { one: 1, two: 2 }, 1)
		let ex = JSON.stringify({
			type: 'save',
			source: 'creator-core',
			data: ['title', { one: 1, two: 2 }, 1],
		})
		expect(parent.postMessage).toHaveBeenLastCalledWith(ex, '*')
	})

	it('save sets default vesion', () => {
		creatorCore.save('title', { one: 1, two: 2 })
		let ex = JSON.stringify({
			type: 'save',
			source: 'creator-core',
			data: ['title', { one: 1, two: 2 }, '1'],
		})
		expect(parent.postMessage).toHaveBeenLastCalledWith(ex, '*')
	})

	it('save sanitizes title', () => {
		creatorCore.save('title <script></script>', {})
		let ex = JSON.stringify({
			type: 'save',
			source: 'creator-core',
			data: ['title &lt;script&gt;&lt;/script&gt;', {}, '1'],
		})
		expect(parent.postMessage).toHaveBeenLastCalledWith(ex, '*')
	})

	it('setHeight sends message', () => {
		creatorCore.setHeight(200)
		let ex = JSON.stringify({
			type: 'setHeight',
			source: 'creator-core',
			data: [200],
		})
		expect(parent.postMessage).toHaveBeenLastCalledWith(ex, '*')
	})

	it('escapeScriptTags cleans tags', () => {
		let ret = creatorCore.escapeScriptTags('<script><a href="test">hi</a></script>')
		expect(ret).toBe('&lt;script&gt;&lt;a href="test"&gt;hi&lt;/a&gt;&lt;/script&gt;')
	})

	it('does not send a request to set height if setHeight is given the current height', () => {
		creatorCore.setHeight(-1)
		expect(parent.postMessage).not.toHaveBeenCalled()
	})

	it('sends a request to set height if setHeight is given the current height', () => {
		creatorCore.setHeight(1)
		expect(parent.postMessage).toHaveBeenCalledWith(
			'{"type":"setHeight","source":"creator-core","data":[1]}',
			'*'
		)
	})

	it('sends a request to set height if setHeight is given nothing', () => {
		mockHeightGetter()
		creatorCore.setHeight()
		expect(parent.postMessage).toHaveBeenCalledWith(
			'{"type":"setHeight","source":"creator-core","data":[10]}',
			'*'
		)
	})

	it('properly sets a resize interval for auto-resizing widgets', () => {
		mockHeightGetter()
		mockCreator.manualResize = false

		//lets us trigger intervals
		jest.useFakeTimers()

		creatorCore.start(mockCreator)
		jest.runOnlyPendingTimers()
		expect(parent.postMessage).toHaveBeenCalledWith(
			'{"type":"setHeight","source":"creator-core","data":[10]}',
			'*'
		)
	})

	it('disables the resize interval correctly', () => {
		mockHeightGetter()
		mockCreator.manualResize = false

		//lets us trigger intervals
		jest.useFakeTimers()

		creatorCore.start(mockCreator)
		parent.postMessage.mockReset()

		creatorCore.disableResizeInterval()
		expect(clearInterval).toHaveBeenCalledTimes(1)

		//no additional post messages should result since we shouldn't have any intervals
		jest.runOnlyPendingTimers()
		expect(parent.postMessage).not.toHaveBeenCalled()
	})
})
