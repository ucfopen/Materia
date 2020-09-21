import './support-page.scss'
import SupportSearch from './support-search'

import React, { useState } from 'react'
import Header from './header'


const SupportPage = () => {
	const [selectedInstance, setSelectedInstance] = useState(null)

	return (
		<>
			<Header />
			<div className="container">
				<div>
					{ !selectedInstance
					? <SupportSearch 
							onClick={setSelectedInstance}/>
					: null
					}
				</div>
			</div>

		</>
	)
}

export default SupportPage
