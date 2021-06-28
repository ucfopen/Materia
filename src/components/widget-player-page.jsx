import React, { useState, useEffect} from 'react'
import Header from './header'
import WidgetPlayer from './widget-player'

const EMBED = 'embed'
const PLAY = 'play'
const PREVIEW = 'preview'
const DEMO = 'demo'

const getWidgetType = (path) => {
	if (path.includes('/embed/')) return EMBED
	else if (path.includes('/play/')) return PLAY
	else if (path.includes('/preview/')) return PREVIEW
	else if (path.includes('/demo')) return DEMO
	else return null
}

const initData = () => ({
	playID: undefined,
	widgetHeight: 0,
	widgetWidth: 0,
	widgetID: undefined
})

const WidgetPlayerPage = () => {
	const type = getWidgetType(window.location.pathname)
	const nameArr = window.location.pathname.replace(`/${type}/`, '').split('/')
	const [initialData, setInitialData] = useState(initData())

	// Waits for window values to load from server then sets them
	useEffect(() => {
		if (type === EMBED) document.body.classList.add('embedded')

		waitForWindow()
		.then(() => {
			if (type === PREVIEW) {
				setInitialData({
					playID: null,
					widgetHeight: window.WIDGET_HEIGHT,
					widgetWidth: window.WIDGET_WIDTH,
					widgetID: nameArr.length >= 1 ? nameArr[0] : null
				})
			}
			else if (type === DEMO) {
				setInitialData({
					playID: window.PLAY_ID,
					widgetHeight: window.WIDGET_HEIGHT,
					widgetWidth: window.WIDGET_WIDTH,
					widgetID: window.DEMO_ID
				})
			}
			else {
				setInitialData({
					playID: window.PLAY_ID,
					widgetHeight: window.WIDGET_HEIGHT,
					widgetWidth: window.WIDGET_WIDTH,
					widgetID: nameArr.length >= 1 ? nameArr[0] : null
				})
			}
		})
	}, [])

	// Used to wait for window data to load
	const waitForWindow = async () => {
		while(!window.hasOwnProperty("PLAY_ID") && !window.hasOwnProperty("WIDGET_HEIGHT") && !window.hasOwnProperty("WIDGET_WIDTH") && !window.hasOwnProperty("DEMO_ID"))
			await new Promise(resolve => setTimeout(resolve, 500))
	}

	return (
		<>
			{
				type !== EMBED
				? <Header />
				: null
			}
			{
				(!!initialData.widgetID) && initialData.playID !== undefined
				? <WidgetPlayer 
						instanceId={initialData.widgetID}
						playId={initialData.playID}
						minHeight={initialData.widgetHeight}
						minWidth={initialData.widgetWidth}/>
				: null
			}
			
		</>
	)
}

export default WidgetPlayerPage
