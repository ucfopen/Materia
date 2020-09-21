import './support-page.scss'

import React, { useState } from 'react'
import Header from './header'

const defaultState = {
	toggle: true
}

const SupportPage = () => {
	const [state, setState] = useState(defaultState)

	return (
		<React.Fragment>
			<Header />
			<div className="support-page">
				<button
					onClick={() => {setState({...state, toggle: !state.toggle})}
				}>
					{state.toggle ? 'On' : 'Off'}
				</button>
			</div>

		</React.Fragment>
	)
}

export default SupportPage
