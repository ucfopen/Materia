import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import Header from './header'
import Catalog from './catalog'

const CatalogPage = props => {
	const [widgets, setWidgets] = useState([])
	const [isLoading, setIsLoading] = useState(true)
	useEffect(() => {
		const options = {
			"headers": {
			  "cache-control": "no-cache",
			  "pragma": "no-cache",
			  "content-type": "application/x-www-form-urlencoded; charset=UTF-8"
			},
			"body": "data=%5B%22all%22%5D",
			"method": "POST",
			"mode": "cors",
			"credentials": "include"
		  }

		fetch('/api/json/widgets_get_by_type/', options)
			.then(resp => resp.json())
			.then(widgets => {
				setIsLoading(false)
				setWidgets(widgets)
			})
	}, [])

	return (
		<>
			<Header />
			<Catalog widgets={widgets} isLoading={isLoading} />
		</>
	)
}

export default CatalogPage
