import React, { useState, useEffect } from 'react'
import Header from './header'
import Summary from './widget-summary'
import EmbedFooter from './widget-embed-footer'
import { waitForWindow } from '../util/wait-for-window'


const LoginsRestrictedToLMS = () => {

	const [state, setState] = useState({
		context: ''
	})

	useEffect(() => {
		waitForWindow(['CONTEXT'])
		.then(() => {
			setState({
				context: window.CONTEXT,
				is_embedded: window.EMBEDDED != undefined ? window.EMBEDDED : false,
			})
		})
	},[])
	
	return (
		<>
			{ state.is_embedded ? '' : <Header /> }
			<div className="container widget">
				<section className="page">
					<Summary/>

					<div className="detail icon-offset">
						<h2 className="unavailable-text">Login from your LMS</h2>
						<span className="unavailable-subtext">You must access Materia from a course in your LMS.</span>
						{ state.context && state.context != 'widget' ? <p>For additional help and support, visit our <a href="/help#students">support page</a>.</p> : '' }
					</div>

					{ state.context && state.context == 'widget' ?  <EmbedFooter/> : '' }
				</section>
			</div>
		</>
	)
}

export default LoginsRestrictedToLMS
