Namespace('Materia').CreatorCore = (() => {
	let _baseurl = null
	let _creatorClass = null
	let _lastHeight = -1
	let _mediaUrl = null
	let _resizeInterval = null

	const _onPostMessage = (e) => {
		if (typeof e.data !== 'string') return
		const msg = JSON.parse(e.data)
		switch (msg.type) {
			case 'initNewWidget':
				_initNewWidget(
					msg.data[0], // widget
					msg.data[1], // baseUrl
					msg.data[2] // mediaUrl
				)
				break
			case 'initExistingWidget':
				_initExistingWidget(
					msg.data[0], // widget
					msg.data[1], // title
					msg.data[2], // qset
					msg.data[3], // qsetVersion
					msg.data[4], // baseUrl
					msg.data[5] // mediaUrl
				)
				break
			case 'onRequestSave':
				_tellCreator('onSaveClicked', [msg.data[0]])
				break
			case 'onSaveComplete':
				_tellCreator('onSaveComplete', [msg.data[0], msg.data[1], msg.data[2], msg.data[3]])
				break
			case 'onMediaImportComplete':
				_tellCreator('onMediaImportComplete', [msg.data[0]])
				break
			case 'onQuestionImportComplete':
				_tellCreator('onQuestionImportComplete', [msg.data[0]])
				break
			default:
				console.warn(`Error, unknown message sent to creator core: ${msg.type}`)
				break
		}
	}

	const _tellCreator = (method, args) => {
		if (typeof _creatorClass[method] === 'function') {
			_creatorClass[method].apply(undefined, args)
		} else {
			alert(`Error, missing creator ${method} called.`)
		}
	}

	const _sendPostMessage = (type, data) =>
		parent.postMessage(JSON.stringify({ type, source: 'creator-core', data }), '*')

	const _initNewWidget = (widget, baseUrl, mediaUrl) => {
		_baseurl = baseUrl
		_mediaUrl = mediaUrl
		_tellCreator('initNewWidget', [widget])
	}

	const _initExistingWidget = (widget, title, qset, qsetVersion, baseUrl, mediaUrl) => {
		_baseurl = baseUrl
		_mediaUrl = mediaUrl
		_tellCreator('initExistingWidget', [widget, title, qset, qsetVersion])
	}

	const start = (creatorClass) => {
		// setup the postmessage listener
		window.addEventListener('message', _onPostMessage, false)

		if (creatorClass.manualResize != null && creatorClass.manualResize === false) {
			_resizeInterval = setInterval(() => {
				setHeight()
			}, 300)
		}

		_creatorClass = creatorClass
		_sendPostMessage('start', null)
	}

	const alert = (msg, title = null, fatal = false) => {
		_sendPostMessage('alert', { msg, title, fatal })
	}

	const getMediaUrl = (mediaId) => `${_mediaUrl}/${mediaId}`

	const showMediaImporter = (types) => {
		if (types == null) {
			types = ['image']
		}
		_sendPostMessage('showMediaImporter', types)
	}

	const directUploadMedia = (mediaData) => {
		_sendPostMessage('directUploadMedia', mediaData)
	}

	const save = (title, qset, version) => {
		if (version == null) {
			version = '1'
		}
		const sanitizedTitle = escapeScriptTags(title)
		_sendPostMessage('save', [sanitizedTitle, qset, version])
	}

	const cancelSave = (msg) => _sendPostMessage('cancelSave', [msg])

	const setHeight = (h) => {
		if (!h) {
			h = document.getElementsByTagName('html')[0].height()
		}
		if (h !== _lastHeight) {
			_sendPostMessage('setHeight', [h])
			_lastHeight = h
		}
	}

	const escapeScriptTags = (text) => text.replace(/</g, '&lt;').replace(/>/g, '&gt;')

	const disableResizeInterval = () => {
		clearInterval(_resizeInterval)
	}

	// Public Methods
	return {
		start,
		alert,
		getMediaUrl,
		showMediaImporter,
		directUploadMedia,
		cancelSave,
		save,
		disableResizeInterval,
		setHeight, // allows the creator to resize its iframe container to fit the height of its contents
		escapeScriptTags,
	}
})()
