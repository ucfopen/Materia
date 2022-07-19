import React, { useState, useEffect} from 'react'
import { apiGetWidgetInstance, apiGetWidgetInstanceScores, apiGetGuestWidgetInstanceScores } from '../util/api'
import { useQuery } from 'react-query'
import Header from './header'
import Scores from './scores'

const ScorePage = () => {
  // get the play_id from the url if using /scores/single/:play_id/:inst_id url
  const res = window.location.pathname.match(/\/scores\/single\/([a-z0-9\-_]+)/i)
	const single_id = (res && res[1]) || null

  // We don't want users who click the 'View more details' link via an LTI to play again, since at that point
	// the play will no longer be connected to the LTI details.
	// This is a cheap way to hide the button:
	const hidePlayAgain = document.URL.indexOf('details=1') > -1
	// get widget id from url like https://my-server.com:8080/scores/nLAmG#play-NbmVXrZe9Wzb
	const inst_id = document.URL.match(/^.+\/([a-z0-9]+)/i)[1]

	// this is only actually set to something when coming from the profile page
	const play_id = window.location.hash.split('play-')[1]

  const [state, setState] = useState({
    instanceID: undefined,
    playID: undefined,
    singleID: undefined,
    sendToken: undefined,
    isEmbedded: null,
    isPreview: null
  })

  // Waits for window values to load from server then sets them
  useEffect(() => {
    if (window.IS_EMBEDDED) document.body.classList.add('embedded')

    waitForWindow()
    .then(() => {
      setState({
        instanceID: (inst_id ? inst_id : null),
        playID: play_id ? play_id : null,
        singleID: single_id ? single_id : null,
        sendToken: typeof window.LAUNCH_TOKEN !== 'undefined' && window.LAUNCH_TOKEN !== null ? window.LAUNCH_TOKEN : play_id,
        isEmbedded: window.IS_EMBEDDED ? window.IS_EMBEDDED : false,
        isPreview: window.IS_PREVIEW ? window.IS_PREVIEW : false,
      })
    })
  }, [])

  // Used to wait for window data to load
  const waitForWindow = async () => {
    while(!window.hasOwnProperty('IS_EMBEDDED')
    && !window.hasOwnProperty('IS_PREVIEW') && !window.hasOwnProperty('LAUNCH_TOKEN')) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }


  let headerRender = null
  if (!state.isEmbedded) {
    headerRender = <Header/>
  }

  let bodyRender = (
    <Scores inst_id={state.instanceID}
      play_id={state.playID}
      single_id={state.singleID}
      send_token={state.sendToken}
      isEmbedded={state.isEmbedded}
      isPreview={state.isPreview}/>
    )

  return (
    <>
    { headerRender }
    { bodyRender }
    </>
  )
}

export default ScorePage
