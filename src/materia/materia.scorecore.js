Namespace('Materia').ScoreCore = (() => {
	let _lastHeight = -1
	let _mediaUrl = null
	let _widgetClass = null

	const _onPostMessage = (e) => {
		if (typeof e.data !== 'string') return
		const msg = JSON.parse(e.data)
		switch (msg.type) {
			case 'initWidget':
				_mediaUrl = msg.data[4]
				_widgetClass.start(
					msg.data[2], // instance
					msg.data[0].data, // qset.data
					msg.data[1], // scoreTable
					msg.data[3], // isPreview
					msg.data[0].version // qset.version
				)
				break
			case 'updateWidget':
				_widgetClass.update(
					msg.data[0].data, // qset.data
					msg.data[1], // scoreTable
					msg.data[0].version // qset.version
				)
				break
			case 'scoreDistribution':
				_widgetClass.handleScoreDistribution(msg.data[0])
				break
			default:
				console.warn(`Error: Score Core received unknown post message: ${msg.type}`)
		}
	}

	const _sendPostMessage = (type, data) => {
		parent.postMessage(JSON.stringify({ type, source: 'score-core', data }), '*')
	}

	const hideResultsTable = () => {
		_sendPostMessage('hideResultsTable')
	}

	const hideScoresOverview = () => {
		_sendPostMessage('hideScoresOverview')
	}

	const getMediaUrl = (mediaId) => `${_mediaUrl}/${mediaId}`

	const requestScoreDistribution = () => {
		_sendPostMessage('requestScoreDistribution')
	}

	const start = (widgetClass) => {
		// setup the postmessage listener
		addEventListener('message', _onPostMessage, false)

		_widgetClass = widgetClass
		_sendPostMessage('start', null)
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

	return {
		getMediaUrl,
		hideResultsTable,
		hideScoresOverview,
		requestScoreDistribution,
		setHeight,
		start,
	}
})()
