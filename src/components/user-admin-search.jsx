import React, { useState } from 'react'
import { iconUrl } from '../util/icon-url'
import { useQuery } from 'react-query'
import { apiSearchUsers } from '../util/api'
import useDebounce from './hooks/useDebounce'

const UserAdminSearch = ({onClick = () => {}}) => {
	const [searchText, setSearchText] = useState('')
	// const [showDeleted, setShowDeleted] = useState(false)
	const debouncedSearchTerm = useDebounce(searchText, 500)
	const { data: searchedUsers, isFetching} = useQuery({
		queryKey: ['search-users', debouncedSearchTerm],
		queryFn: () => apiSearchUsers(debouncedSearchTerm),
		enabled: !!debouncedSearchTerm && debouncedSearchTerm.length > 0,
		placeholderData: null,
		staleTime: Infinity
	})

	const userSearchList = searchedUsers?.map((user, index) => {
		return (
			<div
				className="search_match clickable" key={index} onClick={() => onClick(user)}>
				<div className="img-holder">
					<img src={user.avatar} />
				</div>
				<div className="info-holder">
					{user.first} {user.last}
				</div>
			</div>
		)
	})

	return (
		<section className="page">
			<div className="top">
				<h1>User Admin</h1>
			</div>
			<div className="search">
				<input
					tabIndex="0"
					value={searchText}
					onChange={(e) => setSearchText(e.target.value)}
					className="user_search"
					type="text"
					placeholder="Enter a Materia user's name or email address"/>
			</div>
			<div className="search_list">
				{ userSearchList }
			</div>
		</section>
	)
}

export default UserAdminSearch