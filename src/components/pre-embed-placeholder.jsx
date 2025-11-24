import React, { useState, useEffect} from 'react'
import Summary from './widget-summary'
import EmbedFooter from './widget-embed-footer'
import { waitForWindow } from '../util/wait-for-window'

import './pre-embed-common-styles.scss'


const PreEmbedPlaceholder = () => {

	const [instId, setInstId] = useState(null)
	const [context, setContext] = useState(null)

	useEffect(() => {
		waitForWindow(['INST_ID', 'CONTEXT']).then(() => {
			setInstId(window.INST_ID)
			setContext(window.CONTEXT)
		})
	})

	let bodyRender = null
		bodyRender = (
			<div className="container widget">
				<section className="page">
					<Summary/>
					<div className="detail pre-embed">
						<a className="action_button" href={`/${context}/${instId}`}>Play Widget</a>
					</div>
					<EmbedFooter/>
				</section>
			</div>
		)

	return (
		<>
			{ bodyRender }
		</>
	)
}

export default PreEmbedPlaceholder
