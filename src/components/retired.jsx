import React, { useEffect, useState } from 'react'
import Header from './header'

const Retired = () => {

	const [state, setState] = useState({
		isEmbedded: ''
	})

	const waitForWindow = async () => {
		while(!window.hasOwnProperty('IS_EMBEDDED')) {
			await new Promise(resolve => setTimeout(resolve, 500))
		}
	}

	useEffect(() => {
		waitForWindow()
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
