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
					: <h1>{selectedInstance.name}</h1>
					}
				</div>
			</div>

		</>
	)
}

export default SupportPage
