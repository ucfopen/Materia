import React, {useState, useEffect, useMemo} from 'react'
import Header from './header'
import Scores from './scores'
import LoadingIcon from './loading-icon'
import { waitForWindow } from '../util/wait-for-window'

const ScorePage = () => {

	let isSingle = false
	let isPreview = false
	let isEmbed = false
	let instID = null
	let playID = null
	let token = null

	const urlElements = window.location.pathname.match(/\/scores\/(single\/)?(preview\/)?(embed\/)?([a-z0-9\-_]+)(?:\/([a-z0-9\-_]+))?/i)
	if (urlElements) {
		isSingle = urlElements[1] == "single/"
		isPreview = urlElements[2] == "preview/"
		isEmbed = urlElements[3] == "embed/"
		instID = urlElements[4]
		playID = urlElements[5]
	}


	const urlParams = new URLSearchParams(window.location.search)
	token = urlParams.get('token')

	const [state, setState] = useState({
		instanceID: instID,
		userID: undefined,
		playID: playID,
		isEmbedded: isEmbed,
		isPreview: isPreview,
		isSingle: isSingle,
		ready: false
	})

	useEffect(() => {
		waitForWindow(['USER_ID'])
		.then(() => {
			setState({
				...state,
				userID: window.USER_ID ?? null,
				playID: playID,
				token: token ?? null,
				contextID: window.CONTEXT_ID ?? null,
				isEmbedded: isEmbed || !!token || !!window.LTI_EMBEDDED,
				ready: true
			})
		})
	}, [])


	let headerRender = null
	if (!state.isEmbedded) {
		headerRender = <Header/>
	}

	let bodyRender = null
	if (state.ready) {
		bodyRender = <Scores
		instID={state.instanceID}
		playID={state.playID}
		userID={state.userID}
		token={state.token}
		contextID={state.contextID}
		isEmbedded={state.isEmbedded}
		isPreview={state.isPreview}
		isSingle={state.isSingle}/>
	}
	else {
		bodyRender = <LoadingIcon size='med' />
	}

	if (state.isEmbedded) document.body.classList.add('embedded')

	return (
		<>
			{ headerRender }
			{ bodyRender }
		</>
	)
}

export default ScorePage
