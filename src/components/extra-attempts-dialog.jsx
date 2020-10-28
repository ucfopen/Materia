import React, { useEffect, useState } from 'react'
import Modal from './modal'
import fetchOptions from '../util/fetch-options'
import './extra-attempts-dialog.scss'

// note: this module is originally intended for the admin panel 
// and does not check user permissions

const fetchUsers = (arrayOfUserIds) => fetch('/api/json/user_get', fetchOptions({body: `data=${encodeURIComponent(JSON.stringify([arrayOfUserIds]))}`}))
const searchUsers = (input) => fetch('/api/json/users_search', fetchOptions({body: `data=${encodeURIComponent(JSON.stringify([input]))}`}))
const getExtraAttemptsForInstance = (instId) => fetch(`/api/admin/extra_attempts/${instId}`)

const ExtraAttemptsRow = ({extraAttempt, user, onChange}) => {
	const [state, setState] = useState({...extraAttempt})

	const onRemove = () => {

	}

	const onContextChange = () => {

	}

	const onAttemptsChange = () => {

	}

	return (
		<div className='extra_attempt'>
			<button tabIndex="0"
				onClick={onRemove}
				className="remove">
				X
			</button>

			<div className='user'>
				<img className="avatar" src={user.avatar} />

				<span className='user_name'>
					{`${user.first} ${user.last}`}
				</span>
			</div>

			<div className='context'>
				<input 
					type="text"
					value={state.context_id}
					onChange={onContextChange} />
			</div>

			<div className='num_attempts'>
				<input 
					type="text"
					value={state.extra_attempts}
					onChange={onAttemptsChange} />
			</div>
		</div>
	)
}

const ExtraAttemptsDialog = ({onClose, inst}) => {
	const [searchText, setSearchText] = useState('')
	const [lastSearch, setLastSearch] = useState('')
	const [searchResults, setSearchResults] = useState([])
	const [extraAttempts, setExtraAttempts] = useState({})
	const [users, setUsers] = useState({})

	const onSave = () => {
		
	}

	useEffect(
		() => {
			getExtraAttemptsForInstance(inst.id)
			.then(resp => {
				if(resp.status != 200) return []
				return resp.json()
			})
			.then(resp => {
				const map = new Map()
				for(const i in resp) map.set(resp[i].id, resp[i])
				setExtraAttempts(map)
				const userIds = Array.from(resp, user => user.user_id)
				return fetchUsers(userIds)
			})
			.then(resp => resp.json())
			.then(_users => {
				const keyedUsers = {}
				_users.forEach(u => { keyedUsers[u.id] = u })
				setUsers(keyedUsers)
			})
		}, [inst]
	)

	useEffect(
		() => {
			if(searchText !== lastSearch)
			{
				setLastSearch(searchText)
				
				if(searchText === '') 
				{
					setSearchResults([])
				}
				else 
				{
					// setIsSearching(true)
					searchUsers(searchText)
					.then(resp => {
						// no content
						if(resp.status == 204) return []
						return resp.json()
					})
					.then(results => 
						{
							//filter out users who are not students
							setSearchResults(results.filter(
								user => {
									return user.is_student == true
							}))
						})
				}
			}
		}, [searchText]
	)

	return (
		<Modal onClose={onClose}>
			<div className="extraAttemptsModal">
				<span className="title">Give Students Extra Attempts</span>
				<div className="attempts-container">
					<div className="search-container">
						<span className="search-title">Add students:</span>
						<input
							tabIndex="0"
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							type="text"
							placeholder="Enter a Materia user's name or e-mail"
							className="attempts-input"/>
						<div>
							{ searchResults.length !== 0
								? <div className="attempts_search_list">
									{searchResults.map((match) => 
										<div
											key={match.id}
											className='attempts_search_match clickable'
											onClick={() => onClickMatch(match)}>
												<img className="attempts_match_avatar" src={match.avatar} />
												<p className={`attempts_match_name ${match.is_student ? 'attempts_match_student' : ''}`}>{match.first} {match.last}</p>
										</div>
									)}
									</div>
								: null
							}
						</div>
					</div>

					<div className="attempts_list_container">
						<div className="headers">
							<span className="user-header">User</span>
							<span className="context-header">Course ID</span>
							<span className="attempts-header">Extra Attempts</span>
						</div>

						<div className="attempts_list">
							{Array.from(extraAttempts).map(([attemptId, attemptObj]) => {
								const user = users[attemptObj.user_id]
								if(!user) return <div key={attemptId}>Loading...</div>
								return <ExtraAttemptsRow
									key={attemptId}
									extraAttempt={attemptObj}
									user={user}
									onChange={(id, updatedAttempts) => extraAttempts.set(id, updatedAttempts)}
								/>
							})}
						</div>
					</div>
					<a tabIndex="1" className="cancel_button" onClick={onClose}>
							Cancel
						</a>
						<a tabIndex="2" className="action_button green save_button" onClick={onSave}>
							Save
						</a>
				</div>
			</div>
		</Modal>
	)
}

export default ExtraAttemptsDialog