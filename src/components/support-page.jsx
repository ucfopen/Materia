import React, { useState, useRef, useEffect } from 'react'
import { useQuery } from 'react-query'
import { apiGetUser, apiGetWidgetInstance} from '../util/api'
import SupportSearch from './support-search'
import SupportSelectedInstance from './support-selected-instance'
import Header from './header'
import './support-page.scss'

const SupportPage = () => {
	const [selectedInstance, setSelectedInstance] = useState(null)
	const [widgetHash, setWidgetHash] = useState(window.location.href.split('#')[1])
	const [error, setError] = useState('')
	const mounted = useRef(false)
	const { data: currentUser} = useQuery({
		queryKey: ['user', 'me'],
		queryFn: ({ queryKey }) => {
			const [_key, user] = queryKey
			return apiGetUser(user)
		},
		staleTime: Infinity,
		retry: false,
		onError: (err) => {
			window.location.href = '/login'
		}
	})

	const { data: instFromHash } = useQuery({
		queryKey: ['search-widgets', widgetHash],
		queryFn: () => apiGetWidgetInstance(widgetHash),
		enabled: widgetHash != undefined && widgetHash != selectedInstance?.id,
		staleTime: Infinity,
		retry: false,
		onError: (err) => {
			if (err.message == "Invalid Login") {
				window.location.href = '/login'
			} else {
				setError((err.message || "Error") + ": Failed to retrieve widget(s).")
			}
		}
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
		if (instFromHash) {
			setSelectedInstance(instFromHash)
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

	const onCopySuccess = (inst) => {
		setSelectedInstance(inst)
		window.history.pushState(document.body.innerHTML, document.title, `#${inst.id}`)
	}

	let mainContentRender = null
	if (error) {
		mainContentRender = <div className='error'>{error}</div>
	}
	else if (selectedInstance) {
		mainContentRender = (
			<SupportSelectedInstance inst={selectedInstance}
				key={selectedInstance ? selectedInstance.id : ''}
				currentUser={currentUser}
				onCopySuccess={onCopySuccess}
			/>
		)
	} else {
		mainContentRender = <SupportSearch onClick={handleSearchClick}/>
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
