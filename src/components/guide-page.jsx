import React, { useState, useEffect, useRef } from 'react'
import Header from './header'
import './guide-page.scss'
import { waitForWindow } from '../util/wait-for-window'

const GuidePage = () => {

	const [name, setName] = useState(null)
	const [type, setType] = useState(null)
	const [hasPlayerGuide, setHasPlayerGuide] = useState(null)
	const [hasCreatorGuide, setHasCreatorGuide] = useState(null)
	const [docPath, setDocPath] = useState(null)

	const iframeRef = useRef(null)

	useEffect(() => {
		waitForWindow(['NAME', 'TYPE', 'HAS_PLAYER_GUIDE', 'HAS_CREATOR_GUIDE', 'DOC_PATH']).then(() => {
			setName(window.NAME)
			setType(window.TYPE)
			setHasPlayerGuide(window.HAS_PLAYER_GUIDE)
			setHasCreatorGuide(window.HAS_CREATOR_GUIDE)
			setDocPath(window.DOC_PATH)

			if (document.body.classList.contains('darkMode') && iframeRef.current) {
				iframeRef.current.addEventListener('load', () => {
					iframeRef.current.contentWindow.document.body.classList.add('darkMode')
				})
			}
		})
	})

	let headerRender = <Header />

	let bodyRender = null
	if (!!name) {
		bodyRender = (
			<section className="page">
				<div id="top">
					<h1>{ name }</h1>
					<div id="guide-tabs" className={`${type}-guide`}>
						{ hasPlayerGuide && <a href="../players-guide">Player Guide</a> }
						{ hasCreatorGuide && <a href="../creators-guide">Creator Guide</a>}
					</div>
				</div>
				<div id="guide-container">
					<iframe ref={iframeRef} src={ docPath } className="guide"></iframe>
				</div>
			</section>
		)
	}

	return (
		<>
		{ headerRender }
		{ bodyRender }
		</>
	)
}

export default GuidePage
