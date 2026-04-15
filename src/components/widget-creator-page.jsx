import React, { useState, useEffect} from 'react'
import Header from './header'
import WidgetCreator from './widget-creator'

import './widget-creator-page.scss'

const EMBED = 'embed'

const getWidgetType = () => {
	const urlParams = new URLSearchParams(window.location.search)
	switch(true) {
		case !! urlParams.get('is_embedded'): return EMBED
		default: return null
	}
}

const WidgetCreatorPage = () => {
	const type = getWidgetType()
	const pathParams = window.location.pathname.split('/')
	const widgetID = pathParams[pathParams.length - 3].split('-')[0]
	const instanceID = pathParams[pathParams.length - 1]
	const [state, setState] = useState({
		widgetHeight: 0,
		widgetWidth: 0,
		widgetID: widgetID ?? undefined,
		instanceID: !!instanceID ? instanceID : undefined
	})

	// Waits for window values to load from server then sets them
	useEffect(() => {
		if (type == EMBED) document.body.classList.add('embedded')
		waitForWindow()
		.then(() => {
			setState({
				...state,
				widgetHeight: window.WIDGET_HEIGHT,
				widgetWidth: window.WIDGET_WIDTH
			})
		})
	}, [])

	// Used to wait for window data to load
	const waitForWindow = async () => {
		while(!window.hasOwnProperty('WIDGET_HEIGHT') && !window.hasOwnProperty('WIDGET_WIDTH')) {
			await new Promise(resolve => setTimeout(resolve, 500))
		}
	}

	let headerRender = <Header />
	// No header for embedded widgets
	if (type == EMBED) headerRender = null

	let bodyRender = (
		<WidgetCreator
			widgetId={state.widgetID}
			instId={state.instanceID}
			minHeight={state.widgetHeight}
			minWidth={state.widgetWidth}
			isEmbedded={type == EMBED} />
	)

	return (
		<>
			{ headerRender }
			{ bodyRender }
		</>
	)
}

export default WidgetCreatorPage
