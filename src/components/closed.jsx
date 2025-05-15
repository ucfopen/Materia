import React, {useEffect, useMemo, useState} from 'react';
import Header from './header'
import Summary from './widget-summary'
import './login-page.scss'
import EmbedFooter from './widget-embed-footer';

const Closed = () => {

	const [state, setState] = useState({
		isEmbedded: '',
		instName: '',
		widgetName: '',
		summary: '',
		description: '',
		start: '',
		end: ''
	})

	const waitForWindow = async () => {
		while(!window.hasOwnProperty('IS_EMBEDDED')
		&& !window.hasOwnProperty('NAME')
		&& !window.hasOwnProperty('WIDGET_NAME')
		&& !window.hasOwnProperty('ICON_DIR')
		&& !window.hasOwnProperty('SUMMARY')
		&& !window.hasOwnProperty('DESC')
		&& !window.hasOwnProperty('START')
		&& !window.hasOwnProperty('END')) {
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
				description: window.DESC,
				start: window.START,
				end: window.END,
			})
		})
	},[])

	// Format datetimes to local date/time strings
	const [hydratedSummary, hydratedDescription] = useMemo(() => {
		// Process given datetimes
		const startDatetime = new Date(state.start)
		const endDatetime = new Date(state.end)

		// Format datetimes
		const startDate = startDatetime.toLocaleDateString('en-US', { dateStyle: 'short' })
		const startTime = startDatetime.toLocaleTimeString('en-US', { timeStyle: 'short' })
		const endDate = endDatetime.toLocaleDateString('en-US', { dateStyle: 'short' })
		const endTime = endDatetime.toLocaleTimeString('en-US', { timeStyle: 'short' })

		const summary = state.summary
			.replace("{start_date}", startDate)
			.replace("{start_time}", startTime)
			.replace("{end_date}", endDate)
			.replace("{end_time}", endTime)

		const description = state.description
			.replace("{start_date}", startDate)
			.replace("{start_time}", startTime)
			.replace("{end_date}", endDate)
			.replace("{end_time}", endTime)

		return [summary, description]
	}, [state.summary, state.description, state.start, state.end])

	return (
		<>
			{ state.isEmbedded ? '' : <Header /> }
			<div className="container">
				<section className="page">
					<Summary />
					<h3>{ hydratedSummary }</h3>
					<p>{ hydratedDescription }</p>
					<EmbedFooter/>
				</section>
			</div>
		</>
	)
}

export default Closed
