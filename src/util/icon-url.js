export const iconUrl = (baseDir, widgetDir, size) => {
	const url = baseDir + widgetDir + 'img/icon-' + size
	return url + (window.devicePixelRatio === 2 ? '@2x' : '') + '.png'
}
