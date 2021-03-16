import './support-page.scss'
import SupportSearch from './support-search'
import SupportSelectedInstance from './support-selected-instance'
import fetchOptions from '../util/fetch-options'

import React, { useState, useEffect } from 'react'
import Header from './header'

const fetchCopyInstanceId = (instId, title, copyPermissions) => fetch('/api/json/widget_instance_copy', fetchOptions({body: 'data=' + encodeURIComponent(`["${instId}","${title}","${copyPermissions.toString()}"]`)}))
const fetchInstance = (instId) => fetch('/api/json/widget_instances_get/', fetchOptions({body: 'data=' + encodeURIComponent(`["${instId}"]`)}))
const fetchCurrentUser = () => fetch('/api/json/user_get', fetchOptions({body: `data=${encodeURIComponent('[]')}`}))

const SupportPage = () => {
	const [selectedInstance, setSelectedInstance] = useState(null)
	const [currentUser, setCurrentUser] = useState(null)

	useEffect(() => {
		//fetch current user on initial render
		fetchCurrentUser()
		.then(resp => resp.json())
		.then(user => {
			setCurrentUser(user)
		})
	}, [])

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
	
	const onSelect = (inst) => {
		setSelectedInstance(inst)
	}

	return (
		<>
			<Header />
			<div className="support-page">
				<div>
					{ !selectedInstance
					? <SupportSearch 
							onClick={onSelect}/>
					: <SupportSelectedInstance
							inst={selectedInstance}
							currentUser={currentUser}
							onReturn={() => {setSelectedInstance(null)}}
							onCopy={onCopy}/>
					}
				</div>
			</div>
		</>
	)
}

export default SupportPage
