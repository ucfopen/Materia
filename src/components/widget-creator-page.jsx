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

  const [instId, setInstanceId] = useState(window.location.hash.substr(1));

  const [state, setState] = useState({
    widgetID: window.location.pathname.split('/')[2].split('-')[0],
    creatorGuideURL: window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/')) + '/creators-guide',
    type: getWidgetType(window.location.pathname),
  })

  let headerRender = <Header />
  // No header for embedded widgets
  if ( state.type == EMBED || state.type == PREVIEW_EMBED ) headerRender = null

  let bodyRender = (<WidgetCreator 
    widgetId={state.widgetID} 
    instId={instId}
    setInstanceId={setInstanceId}
    creatorGuideURL={state.creatorGuideURL}
  />)

  return (
    <>
      { headerRender }
      { bodyRender }
    </>
  )
}

export default WidgetCreatorPage
