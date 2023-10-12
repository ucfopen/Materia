import { useQuery } from 'react-query'
import { apiGetUser, apiGetUsers} from '../util/api'
import React, { useState, useRef, useEffect } from 'react'
import Header from './header'
import UserAdminSearch from './user-admin-search'
import UserAdminSelected from './user-admin-selected'
import './user-admin-page.scss'

const UserAdminPage = () => {
	const [selectedUser, setSelectedUser] = useState(null)
	const [userHash, setUserHash] = useState(window.location.href.split('#')[1])
	const { data: currentUser} = useQuery({
		queryKey: 'user',
		queryFn: apiGetUser,
		staleTime: Infinity
	})

	const { data: userFromHash } = useQuery({
		queryKey: ['search-users', userHash],
		queryFn: () => apiGetUsers([userHash]),
		enabled: userHash != undefined && userHash != undefined && userHash != selectedUser?.id,
		placeholderData: null,
		staleTime: Infinity
	})

	useEffect(() => {
		window.addEventListener('hashchange', listenToHashChange)

		return () => window.removeEventListener('hashchange', listenToHashChange)
	}, [])

	useEffect(() => {
		if (userFromHash && userFromHash[userHash]) {
			setSelectedUser(userFromHash[userHash])
		}
	},[userFromHash])

	const listenToHashChange = () => {
		const match = window.location.hash.match(/#([0-9])$/)
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
	if (selectedUser) pageRenderContent = <UserAdminSelected selectedUser={selectedUser} currentUser={currentUser} onReturn={() => setSelectedUser(null)}></UserAdminSelected>

	return (
		<>
			<Header />
			<div className="support-page">
				<div>
					{ pageRenderContent }
				</div>
			</div>
		</>
	)
}

export default UserAdminPage
