Namespace('Materia').Engine = (() => {
	let _baseUrl = null
	let _instance = null
	let _lastHeight = -1
	let _mediaUrl = null
	let _resizeInterval = null
	let _widgetClass = null

	const _onPostMessage = (e) => {
		if (typeof e.data !== 'string') return
		const msg = JSON.parse(e.data)
		switch (msg.type) {
			case 'initWidget':
				_baseUrl = msg.data[2]
				_mediaUrl = msg.data[3]
				_initWidget(msg.data[0], msg.data[1])
				break
			default:
				throw new Error(`Error: Engine Core received unknown post message: ${msg.type}`)
				break
		}
	}

	const _sendPostMessage = (type, data) => {
		parent.postMessage(JSON.stringify({ type, data }), '*')
	}

	// Called by Materia.Player when your widget Engine should start the user experience
	const _initWidget = (qset, instance) => {
		_widgetClass.start(instance, qset.data, qset.version)
		_instance = instance
	}

	const start = (widgetClass) => {
		// setup the postmessage listener
		addEventListener('message', _onPostMessage, false)

		if (widgetClass.manualResize != null && widgetClass.manualResize === false) {
			_resizeInterval = setInterval(() => {
				setHeight()
			}, 300)
		}

		_widgetClass = widgetClass
		_sendPostMessage('initialize')
		_sendPostMessage('start', null)
	}

	const sendStorage = (args) => {
		_sendPostMessage('sendStorage', args)
	}

	const addLog = (type, item_id, text, value) => {
		if (type == null) {
			type = ''
		}
		if (item_id == null) {
			item_id = 0
		}
		if (text == null) {
			text = ''
		}
		_sendPostMessage('addLog', { type, item_id, text, value })
	}

	const alert = (title, msg, fatal = false) => {
		_sendPostMessage('alert', { title, msg, fatal })
	}

	const getMediaUrl = (mediaId) => `${_mediaUrl}/${mediaId}`

	const end = (showScoreScreenAfter) => {
		if (showScoreScreenAfter == null) {
			showScoreScreenAfter = true
		}
		_sendPostMessage('end', showScoreScreenAfter)
	}

	const sendPendingLogs = () => {
		_sendPostMessage('sendPendingLogs', {})
	}

	const setHeight = (h) => {
		if (!h) {
			h = parseInt(window.getComputedStyle(document.documentElement).height, 10)
		}
		if (h !== _lastHeight) {
			_sendPostMessage('setHeight', [h])
			_lastHeight = h
		}
	}

	const setVerticalScroll = (location) => {
		_sendPostMessage('setVerticalScroll', [location])
	}

	const disableResizeInterval = () => {
		clearInterval(_resizeInterval)
	}

	const escapeScriptTags = (text) => text.replace(/</g, '&lt;').replace(/>/g, '&gt;')

	return {
		start,
		addLog,
		alert,
		getImageAssetUrl: getMediaUrl, // will be deprecated - use getMediaUrl
		getMediaUrl: getMediaUrl,
		end,
		sendPendingLogs,
		sendStorage,
		disableResizeInterval,
		setHeight, // allows the widget to resize its iframe container to fit the height of its contents
		setVerticalScroll, // allows the widget to scroll the page to a specific location
		escapeScriptTags,
	}
})()
