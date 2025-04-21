import { useQuery } from 'react-query'
import { apiGetUser, apiGetUsers} from '../util/api'
import React, { useState, useRef, useEffect } from 'react'
import Header from './header'
import UserAdminSearch from './user-admin-search'
import UserAdminSelected from './user-admin-selected'
import './user-admin-page.scss'

const UserAdminPage = () => {
	const [selectedUser, setSelectedUser] = useState(null)
	const [error, setError] = useState('')
	const [userHash, setUserHash] = useState(window.location.href.split('#')[1])
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

	const { data: userFromHash, refetch: refetchFromHash } = useQuery({
		queryKey: ['user', userHash],
		queryFn: () => apiGetUsers([userHash]),
		enabled: userHash != undefined,
		placeholderData: undefined,
		staleTime: Infinity,
		retry: false
	})

	useEffect(() => {
		window.addEventListener('hashchange', listenToHashChange)

		return () => window.removeEventListener('hashchange', listenToHashChange)
	}, [])

	useEffect(() => {
		if (userFromHash && userFromHash[userHash]) {
			setError('')
			setSelectedUser(userFromHash[userHash])
		}
		else if (userFromHash != undefined) {
			setError("Failed to retrieve user.")
			setSelectedUser(null)
		}
	},[userFromHash])

	useEffect(() => {
		if (userHash && userHash != selectedUser?.id) refetchFromHash()
	},[userHash])

	const listenToHashChange = () => {
		let match = window.location.hash.match(/#([0-9]+)$/)
		if (match != undefined && match[1] != undefined) setUserHash(match[[1]])
	}

	const handleUserSelect = (user) => {
		setSelectedUser(user)
		if (user != null) {
			window.history.pushState(document.body.innerHTML, document.title, `#${user.id}`)
		} else {
			window.history.pushState(document.body.innerHTML, document.title, '')
		}
	}

	let pageRenderContent = <UserAdminSearch onClick={handleUserSelect}/>
	let errorContent = <></>
	if (error) {
		errorContent = <div className="error">{error}</div>
	}
	if (selectedUser) pageRenderContent = <UserAdminSelected selectedUser={selectedUser} currentUser={currentUser} onReturn={() => setSelectedUser(null)}></UserAdminSelected>

	return (
		<>
			<Header />
			<div className="support-page">
				<div>
					{ pageRenderContent }
					{errorContent}
				</div>
			</div>
		</>
	)
}

export default UserAdminPage
