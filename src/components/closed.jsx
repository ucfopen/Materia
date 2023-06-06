import React, { useEffect, useState } from 'react';
import Header from './header'
import Summary from './widget-summary'
import './login-page.scss'

const Closed = () => {

	const [state, setState] = useState({
		isEmbedded: '',
		instName: '',
		widgetName: '',
		summary: '',
		description: ''
	})

	const waitForWindow = async () => {
		while(!window.hasOwnProperty('IS_EMBEDDED')
		&& !window.hasOwnProperty('NAME')
		&& !window.hasOwnProperty('WIDGET_NAME')
		&& !window.hasOwnProperty('ICON_DIR')
		&& !window.hasOwnProperty('SUMMARY')
		&& !window.hasOwnProperty('DESC')) {
			await new Promise(resolve => setTimeout(resolve, 500))
		}
	}

	useEffect(() => {
		waitForWindow()
		.then(() => {
			setState({
				isEmbedded: window.IS_EMBEDDED,
				instName: window.NAME,
				widgetName: window.WIDGET_NAME,
				summary: window.SUMMARY,
				description: window.DESC
			})
		})
	},[])

	return (
		<>
			{ state.isEmbedded ? '' : <Header /> }
			<div className="container">
				<section className="page">
					<Summary />
					<h3>{ state.summary }</h3>
					<p>{ state.description }</p>
				</section>
			</div>
		</>
	)
}

export default Closed
