Namespace('Materia').Image = (() => {
	const iconUrl = (widgetDir, size) => {
		if (window.devicePixelRatio === 2) {
			return WIDGET_URL + widgetDir + 'img/icon-' + size + '@2x.png'
		} else {
			return WIDGET_URL + widgetDir + 'img/icon-' + size + '.png'
		}
	}

	const screenshotUrl = (widgetDir, size) =>
		WIDGET_URL + widgetDir + 'img/screen-shots/' + size + '.png'

	const screenshotThumbUrl = (widgetDir, size) =>
		WIDGET_URL + widgetDir + 'img/screen-shots/' + size + '-thumb.png'

	return {
		iconUrl,
		screenshotUrl,
		screenshotThumbUrl,
	}
})()
