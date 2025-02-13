import React, {useState, useEffect, useMemo} from 'react'
import Header from './header'
import Scores from './scores'

const ScorePage = () => {
	// get the playId from the url if using /scores/single/:playId/:instId url
	const res = window.location.pathname.match(/\/scores\/single\/([a-z0-9\-_]+)/i)
	const single_id = (res && res[1]) || null

	// We don't want users who click the 'View more details' link via an LTI to play again, since at that point
	// the play will no longer be connected to the LTI details.
	// This is a cheap way to hide the button:
	const hidePlayAgain = document.URL.indexOf('details=1') > -1
	// get widget id from url like https://my-server.com:8080/scores/nLAmG#play-NbmVXrZe9Wzb
	const split_url = document.URL.match(/^.+\/([a-z0-9]+)\/([a-z0-9-]+)/i)

	let pathIsPreview = false
	let instId = null
	let playId = null
	if (split_url[1] === 'preview') {
		pathIsPreview = true
		instId = split_url[2]
	} else {
		instId = split_url[1]
		playId = split_url[2]
	} // TODO This might be wrong (django rewrite)

	const previewPlayId = useMemo(() => {
		let params = new URLSearchParams(document.location.search);
		return params.get("previewId")
	}, [])

	// this is only actually set to something when coming from the profile page
	//const playId = window.location.hash.split('play-')[1]

	const pathIsEmbedded = window.location.pathname.includes('/embed/')

	const [state, setState] = useState({
		instanceID: undefined,
		playID: undefined,
		singleID: undefined,
		sendToken: undefined,
		isEmbedded: pathIsEmbedded,
		isPreview: pathIsPreview
	})

	// Waits for window values to load from server then sets them
	useEffect(() => {
		waitForWindow()
		.then(() => {
			if (window.IS_EMBEDDED) document.body.classList.add('embedded')

			setState({
				instanceID: (instId ? instId : null),
				playID: playId ? playId : null,
				singleID: single_id ? single_id : null,
				sendToken: typeof window.LAUNCH_TOKEN !== 'undefined' && window.LAUNCH_TOKEN !== null ? window.LAUNCH_TOKEN : playId,
				isEmbedded: window.IS_EMBEDDED == 'true' || window.IS_EMBEDDED == true || pathIsEmbedded ? true : false,
				isPreview: window.IS_PREVIEW == 'true' || window.IS_PREVIEW == true || pathIsPreview ? true : false,
			})
		})
	}, [])

	// Used to wait for window data to load
	const waitForWindow = async () => {
		while(!window.hasOwnProperty('IS_EMBEDDED')
		&& !window.hasOwnProperty('IS_PREVIEW')
		&& !window.hasOwnProperty('LAUNCH_TOKEN')) {
			await new Promise(resolve => setTimeout(resolve, 500))
		}
	}


	let headerRender = null
	if (!state.isEmbedded) {
		headerRender = <Header/>
	}

	let bodyRender = null
	if ( state.isPreview !== undefined ) {
		bodyRender = <Scores instId={state.instanceID}
		playId={state.playID}
		single_id={state.singleID}
		send_token={state.sendToken}
		isEmbedded={state.isEmbedded}
		isPreview={state.isPreview}
	  previewPlayId={previewPlayId}/>
	}

	return (
		<>
			{ headerRender }
			{ bodyRender }
		</>
	)
}

export default ScorePage
