import { useQuery } from 'react-query'
import { apiGetUser} from '../util/api'
import React, { useState, useRef, useEffect } from 'react'
import Header from './header'
import UserAdminSearch from './user-admin-search'
import UserAdminSelected from './user-admin-selected'
import './user-admin-page.scss'

const UserAdminPage = () => {
	const [selectedUser, setSelectedUser] = useState(null)
	const { data: currentUser} = useQuery({
		queryKey: 'user',
		queryFn: apiGetUser,
		staleTime: Infinity
	})

	let pageRenderContent = <UserAdminSearch onClick={(user) => setSelectedUser(user)}/>
	if (selectedUser) pageRenderContent = <UserAdminSelected user={selectedUser} currentUser={currentUser} onReturn={() => setSelectedUser(null)}></UserAdminSelected>

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
