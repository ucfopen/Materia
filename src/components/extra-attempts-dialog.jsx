import React, { useEffect, useState } from 'react'
import Modal from './modal'
import fetchOptions from '../util/fetch-options'
import './extra-attempts-dialog.scss'

// note: this module is originally intended for the admin panel 
// and does not check user permissions

// fetch requests relevant for this component
const fetchUsers = (arrayOfUserIds) => fetch('/api/json/user_get', fetchOptions({body: `data=${encodeURIComponent(JSON.stringify([arrayOfUserIds]))}`}))
const searchUsers = (input) => fetch('/api/json/users_search', fetchOptions({body: `data=${encodeURIComponent(JSON.stringify([input]))}`}))
const getExtraAttemptsForInstance = (instId) => fetch(`/api/admin/extra_attempts/${instId}`)
const setExtraAttemptsForInstance = (instId, attempts) => fetch(`/api/admin/extra_attempts/${instId}`, 
{
	method: 'POST',
	mode: 'cors', 
	credentials: 'include', 
	headers: {
		pragma: "no-cache",
		"cache-control": "no-cache",
		"content-type": "application/json; charset=UTF-8"
	},
	body: JSON.stringify(attempts) 
})

// Component for each individual row in the Extra Attempts Gui
const ExtraAttemptsRow = ({extraAttempt, user, onChange}) => {
	// holds updated state of each extra attempts object/row
	// to send to parent if changed
	const [state, setState] = useState({...extraAttempt})
	// sets row to display:none if removed, until parent render updates
	const [disabled, setDisabled] = useState(false)

	// anytime the state of this row changes, update the parent object
	useEffect(
		() => {
			onChange(extraAttempt.id, {
				id: state.id,
				context_id: state.context_id,
				extra_attempts: state.extra_attempts,
				user_id: state.user_id
			})
		}, [state]
	)

	const onRemove = () => {
		setState({...state, extra_attempts: -1})
		setDisabled(true)
	}

	const onContextChange = e => {
		setState({...state, context_id: e.target.value })
	}

	const onAttemptsChange = e => {
		setState({...state, extra_attempts: e.target.value})
	}

	return (
		<div className={`extra_attempt ${disabled ? 'disabled' : ''}`}>
			<div className="user_holder">
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
			</div>

			<div className='context'>
				<input 
					type="text"
					value={state.context_id}
					onChange={onContextChange} 
					required />
			</div>

			<div className='num_attempts'>
				<input 
					type="number"
					min="1"
					max="99"
					value={state.extra_attempts}
					onChange={onAttemptsChange}
					required />
			</div>
		</div>
	)
}

// Component for Extra Attempts Gui
const ExtraAttemptsDialog = ({onClose, inst}) => {
	const [searchText, setSearchText] = useState('')
	const [lastSearch, setLastSearch] = useState('')
	const [searchResults, setSearchResults] = useState([])
	// map of extra attempt objects for a particular instance
	// key: id of extra attempt row in the db
	// when creating a new row, id's are negative increments (newIdCount)
	const [extraAttempts, setExtraAttempts] = useState({})
	// hold users that correlate to extra attempts
	const [users, setUsers] = useState({})
	// new attempt object Id's are negative so as not to conflict with existing Id's
	const [newIdCount, setNewIdCount] = useState(-1)
	// display error above save button using the text from this hook:
	const [saveError, setSaveError] = useState('')

	// set the hooks on initial load
	useEffect(
		() => {
			getExtraAttemptsForInstance(inst.id)
			.then(resp => {
				if(resp.status != 200) return [] // no response means map will be empty
				return resp.json()
			})
			.then(resp => {
				const map = new Map()
				for(const i in resp)
				{
					map.set(parseInt(resp[i].id), 
						{
							id: parseInt(resp[i].id),
							user_id: parseInt(resp[i].user_id),
							context_id: resp[i].context_id,
							extra_attempts: parseInt(resp[i].extra_attempts)
						})
				} 
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

	// find search results
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

	const onClickMatch = match => {
		setSearchText('')
		setLastSearch('')
		setSearchResults([])

		// add user to users list if not already there 
		if(!(match.id in users)){
			const tempUsers = users
			tempUsers[match.id] = match
			setUsers(tempUsers)
		}

		// add another extra attempts row
		const tempAttempts = extraAttempts
		tempAttempts.set(
			newIdCount,
			{
				id: newIdCount,
				context_id: '',
				extra_attempts: 1,
				user_id: match.id
			}
		)
		setExtraAttempts(tempAttempts)
		setNewIdCount(newIdCount-1)
	}

	const onSave = () => {
		// check to see if course id is null or extra attempts is < 1
		extraAttempts.forEach((obj) => {
			if(obj.context_id == '') setSaveError('Must fill in Course ID field')
		})
		// post request
		setExtraAttemptsForInstance(inst.id, Array.from(extraAttempts.values()))
		.then(onClose())
	}

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
								if(attemptObj.extra_attempts < 0) return
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
					<div className="save-error">
						{ saveError != ''
							? <p>{saveError}</p>
							: null
						}
					</div>
					<div className="button-holder">
						<a tabIndex="1" className="cancel_button" onClick={onClose}>
								Cancel
						</a>
						<a tabIndex="2" className="action_button green save_button" onClick={onSave}>
							Save
						</a>
					</div>
				</div>
			</div>
		</Modal>
	)
}

export default ExtraAttemptsDialog