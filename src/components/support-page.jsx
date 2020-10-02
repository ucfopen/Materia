import './support-page.scss'
import SupportSearch from './support-search'
import SupportSelectedInstance from './support-selected-instance'
import fetchOptions from '../util/fetch-options'

import React, { useState, useEffect } from 'react'
import Header from './header'

const fetchCopyInstanceId = (instId, title, copyPermissions) => fetch('/api/json/widget_instance_copy', fetchOptions({body: 'data=' + encodeURIComponent(`["${instId}","${title}","${copyPermissions.toString()}"]`)}))
const fetchInstance = (instId) => fetch('/api/json/widget_instances_get/', fetchOptions({body: 'data=' + encodeURIComponent(`["${instId}"]`)}))

const SupportPage = () => {
	const [selectedInstance, setSelectedInstance] = useState(null)
	
	useEffect(() => {
		console.log(selectedInstance)
	})

	const onCopy = (instId, title, copyPerms) => {
		fetchCopyInstanceId(instId, title, copyPerms)
		.then(resp => resp.json())
		.then(duplicateId => {
			setSelectedInstance(null)
			fetchInstance(duplicateId)
			.then(resp => resp.json())
			.then(instances => setSelectedInstance(instances[0]))
		})
	}
	

	return (
		<>
			<Header />
			<div className="support-page">
				<div>
					{ !selectedInstance
					? <SupportSearch 
							onClick={setSelectedInstance}/>
					: <SupportSelectedInstance
							inst={selectedInstance}
							onReturn={() => {setSelectedInstance(null)}}
							onCopy={onCopy}/>
					}
				</div>
			</div>

		</>
	)
}

export default SupportPage
