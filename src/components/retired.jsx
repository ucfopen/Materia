import React, { useEffect, useState } from 'react'
import Header from './header'
import { waitForWindow } from '../util/wait-for-window'

const Retired = () => {

	const [state, setState] = useState({
		isEmbedded: ''
	})

	useEffect(() => {
		waitForWindow(['IS_EMBEDDED'])
		.then(() => {
			setState({
				isEmbedded: window.IS_EMBEDDED
			})
		})
	},[])

	return (
		<>
			{ state.isEmbedded ? '' : <Header /> }
			<div className="container">
				<section className="page">
					<h3>Sorry, this widget is no longer playable.</h3>
				</section>
			</div>
		</>
	)
}

export default Retired
