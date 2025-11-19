import React, { useState, useEffect} from 'react'
import Header from './header'
import WidgetPlayer from './widget-player'
import useCreatePlaySession from './hooks/useCreatePlaySession'
import { waitForWindow } from '../util/wait-for-window'

const EMBED = 'embed'
const PLAY = 'play'
const PREVIEW = 'preview'
const DEMO = 'demo'
const PREVIEW_EMBED = 'preview-embed'
const LEGACY_EMBED = 'legacy-embed'

const getWidgetType = path => {
	switch(true) {
		case path.includes('/embed/'): return EMBED
		case path.includes('/play/'): return PLAY
		case path.includes('/preview/'): return PREVIEW
		case path.includes('/demo'): return DEMO
		case path.includes('/preview-embed/'): return PREVIEW_EMBED
		case path.includes('/lti/assignment'): return LEGACY_EMBED
		default: return null
	}
}

const WidgetPlayerPage = () => {

	const createPlaySession = useCreatePlaySession()

	const type = getWidgetType(window.location.pathname)
	const nameArr = window.location.pathname.replace(`/${type}/`, '').split('/')
	const [state, setState] = useState({
		playID: undefined,
		widgetHeight: 0,
		widgetWidth: 0,
		widgetID: undefined,
		ltiToken: undefined
	})

	// Waits for window values to load from server then sets them
	useEffect(() => {
		if (type == EMBED || type == PREVIEW_EMBED || type == LEGACY_EMBED) document.body.classList.add('embedded')

		waitForWindow(['WIDGET_HEIGHT', 'WIDGET_WIDTH', 'PLAY_ID', 'DEMO_ID'])
		.then(() => {
			switch(type) {
				case PREVIEW_EMBED:
				case PREVIEW:
					setState(state => ({
						...state,
						widgetHeight: window.WIDGET_HEIGHT,
						widgetWidth: window.WIDGET_WIDTH,
						widgetID: nameArr.length >= 1 ? nameArr[0] : null,
						playID: window.PLAY_ID,
					}))
					break
				case LEGACY_EMBED:
					const params = window.location.search
					const instId = new URLSearchParams(params).get('widget')
					setState(state => ({
						...state,
						widgetHeight: window.WIDGET_HEIGHT,
						widgetWidth: window.WIDGET_WIDTH,
						widgetID: instId,
						playID: window.PLAY_ID,
						ltiToken: window.LTI_TOKEN
					}))
					break
				case DEMO:
					setState(state => ({
						...state,
						widgetHeight: window.WIDGET_HEIGHT,
						widgetWidth: window.WIDGET_WIDTH,
						widgetID: window.DEMO_ID,
						playID: window.PLAY_ID,
					}))
					break
				default:
					setState(state => ({
						...state,
						widgetHeight: window.WIDGET_HEIGHT,
						widgetWidth: window.WIDGET_WIDTH,
						widgetID: nameArr.length >= 1 ? nameArr[0] : null,
						playID: window.PLAY_ID,
						ltiToken: window.LTI_TOKEN
					}))
					break
			}
		})
	}, [])

	useEffect(() => {
		if ( !!state.ltiToken) {
			history.pushState(null, '', `${window.location.pathname}?token=${state.ltiToken}`)
		}
	},[state.ltiToken])

	let headerRender = <Header />
	// No header for embedded widgets
	if ( type == EMBED || type == PREVIEW_EMBED || type == LEGACY_EMBED ) headerRender = null

	let bodyRender = null

	if( !!state.widgetID && state.playID !== undefined ) {
		bodyRender = (
			<WidgetPlayer instanceId={state.widgetID}
				playId={state.playID}
				minHeight={state.widgetHeight}
				minWidth={state.widgetWidth}/>
		)
	}

	return (
		<>
			{ headerRender }
			{ bodyRender }
		</>
	)
}

export default WidgetPlayerPage
