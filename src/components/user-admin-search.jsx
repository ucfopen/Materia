import React, { useState } from 'react'
import useDebounce from './hooks/useDebounce'
import useUserList from './hooks/useUserList'
import LoadingIcon from './loading-icon'

const UserAdminSearch = ({onClick = () => {}}) => {
	const [searchText, setSearchText] = useState('')
	const debouncedSearchTerm = useDebounce(searchText, 500)
	const userList = useUserList(debouncedSearchTerm)

	const userSearchList = userList.users?.map((user, index) => {
		return (
			<div
				className="search_match clickable" key={index}
				onClick={() => onClick(user)}>
				<div className="img-holder">
					<img src={user.avatar} />
				</div>
				<div className="info-holder">
					{user.first} {user.last}
				</div>
			</div>
		)
	})

	let loadingRender = null
	if ((userList.isFetching || !userList.users) && searchText.length > 0) {
		loadingRender = (
			<div className='loading'>
				<LoadingIcon size="sm" width="50px"></LoadingIcon>
				<p className="loading-text">Searching Users ...</p>
			</div>
		)
	} else if (userList.isFetching) {
		loadingRender = <div className="loading">
			<LoadingIcon size="sm" width="50px"></LoadingIcon>
			<p className="loading-text">Loading users...</p>
		</div>
	}

	let searchPromptRender = (
		<div className='user_search'>
			<p>{`${searchText.length == 0 || (userList.users && userList.users.length > 0)
				|| userList.isFetching ? 'Search for a user by entering their name'
				: 'No users match your description'}`}</p>
		</div>
	)

	return (
		<section className="page">
			<div className="top">
				<h1>User Admin</h1>
			</div>
			<div className="search">
				{ searchPromptRender }
				<input
					tabIndex="0"
					value={searchText}
					onChange={(e) => setSearchText(e.target.value)}
					className="user_search"
					type="text"
					placeholder="Enter a Materia user's name or email address"/>
			</div>
			{ loadingRender }
			<div className="search_list">
				{ userSearchList }
			</div>
		</section>
	)
}

export default UserAdminSearch