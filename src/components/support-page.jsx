import './support-page.scss'
import SupportSearch from './support-search'
import SupportSelectedInstance from './support-selected-instance'

import React, { useState, useEffect } from 'react'
import Header from './header'


const SupportPage = () => {
	const [selectedInstance, setSelectedInstance] = useState(null)

	useEffect(() => {
		console.log(selectedInstance)
	})
	return (
		<>
			<Header />
			<div className="container">
				<div>
					{ !selectedInstance
					? <SupportSearch 
							onClick={setSelectedInstance}/>
					: <SupportSelectedInstance
							inst={selectedInstance}
							onReturn={() => {setSelectedInstance(null)}}/>
					}
				</div>
			</div>

		</>
	)
}

export default SupportPage
