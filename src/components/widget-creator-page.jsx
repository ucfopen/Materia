import React, { useState, useEffect} from 'react'
import Header from './header'
import WidgetCreator from './widget-creator'

import './widget-creator-page.scss'

const EMBED = 'embed'
const PREVIEW_EMBED = 'preview-embed'

const getWidgetType = path => {
  switch(true) {
    case path.includes('/embed/'): return EMBED
    case path.includes('/preview-embed/'): return PREVIEW_EMBED
    default: return null
  }
}

const WidgetCreatorPage = () => {
  const type = getWidgetType(window.location.pathname)
  const pathParams = window.location.pathname.split('/');
  const widgetID = pathParams[pathParams.length - 2].split('-')[0];
  const instanceID = window.location.hash.substr(1)
  const [state, setState] = useState({
    widgetHeight: 0,
    widgetWidth: 0,
    widgetID: undefined,
    instanceID: undefined
  })

  // Waits for window values to load from server then sets them
  useEffect(() => {
    if (type == EMBED || type == PREVIEW_EMBED) document.body.classList.add('embedded')

    waitForWindow()
    .then(() => {
      setState({
        widgetHeight: window.WIDGET_HEIGHT,
        widgetWidth: window.WIDGET_WIDTH,
        widgetID: widgetID ? widgetID : null,
        instanceID: instanceID ? instanceID : null
      })
    })
  }, [])

  // Used to wait for window data to load
  const waitForWindow = async () => {
    while(!window.hasOwnProperty('WIDGET_HEIGHT')
    && !window.hasOwnProperty('WIDGET_WIDTH')) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  let headerRender = <Header />
  // No header for embedded widgets
  if ( type == EMBED || type == PREVIEW_EMBED ) headerRender = null

  let bodyRender = (<WidgetCreator widgetId={state.widgetID} instId={state.instanceID}
    minHeight={state.widgetHeight}
    minWidth={state.widgetWidth}/>)

  return (
    <>
      { headerRender }
      { bodyRender }
    </>
  )
}

export default WidgetCreatorPage
