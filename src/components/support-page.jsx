import React, { useState, useRef, useEffect } from 'react'
import { useQuery } from 'react-query'
import { apiGetUser, apiSearchInstances} from '../util/api'
import SupportSearch from './support-search'
import SupportSelectedInstance from './support-selected-instance'
import Header from './header'
import './support-page.scss'

const SupportPage = () => {
	const [selectedInstance, setSelectedInstance] = useState(null)
	const [widgetHash, setWidgetHash] = useState(window.location.href.split('#')[1])
	const mounted = useRef(false)
	const { data: currentUser} = useQuery({
		queryKey: 'user',
		queryFn: apiGetUser,
		staleTime: Infinity
	})

	const { data: instFromHash } = useQuery({
		queryKey: ['search-widgets', widgetHash],
		queryFn: () => apiSearchInstances(widgetHash),
		enabled: widgetHash != undefined && widgetHash != selectedInstance?.id,
		staleTime: Infinity
	})

	useEffect(() => {
		mounted.current = true
		window.addEventListener('hashchange', listenToHashChange)

		return () => {
			mounted.current = false
			window.removeEventListener('hashchange', listenToHashChange)
		}
	}, [])


	useEffect(() => {
		if (Array.isArray(instFromHash) && instFromHash.length > 0) {
			setSelectedInstance(instFromHash[[0]])
		}
	},[instFromHash])

	const listenToHashChange = () => {
		const match = window.location.hash.match(/#([A-Za-z0-9]{5})$/)
		if (match != null && match[1] != null)
		{
			setWidgetHash(match[[1]])
		}
	}

	const handleSearchClick = inst => {
		setSelectedInstance(inst)
		window.history.pushState(document.body.innerHTML, document.title, `#${inst.id}`)
	}

	let mainContentRender = <SupportSearch onClick={handleSearchClick}/>
	if (selectedInstance) {
		mainContentRender = (
			<SupportSelectedInstance inst={selectedInstance}
				key={selectedInstance ? selectedInstance.id : ''}
				currentUser={currentUser}
			/>
		)
	}

	return (
		<>
			<Header />
			<div className="support-page">
				<div>
					{ mainContentRender }
				</div>
			</div>
		</>
	)
}

export default SupportPage
