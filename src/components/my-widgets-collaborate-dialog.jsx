import React, { useEffect, useState, useRef } from 'react'
import Modal from './modal'
import fetchOptions from '../util/fetch-options'
import useClickOutside from '../util/use-click-outside'
import './my-widgets-collaborate-dialog.scss'

const PERM_VISIBLE = 1
const PERM_PLAY = 5
const PERM_SCORE = 10
const PERM_DATA = 15
const PERM_EDIT = 20
const PERM_COPY = 25
const PERM_FULL = 30
const PERM_SHARE = 35
const PERM_SU = 90

const accessLevels = {
	[PERM_VISIBLE]: { value: PERM_VISIBLE, text: 'View Scores' },
	[PERM_FULL]: { value: PERM_FULL, text: 'Full' }
}

const fetchUsers = (arrayOfUserIds) => fetch('/api/json/user_get', fetchOptions({body: `data=${encodeURIComponent(JSON.stringify([arrayOfUserIds]))}`}))
const searchUsers = (input) => fetch('/api/json/users_search', fetchOptions({body: `data=${encodeURIComponent(JSON.stringify([input]))}`}))


const defaultState = {
	deleted: false
}

const timestampToDisplayDate = (timestamp) => {
	if(!timestamp) return 'never'
	var date = new Date(timestamp*1000);
	//this date works properly with input's date value (yyyy-mm-dd)
	return date.getFullYear() + '-' + ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '-' + ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate()))
	// return ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '/' + ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate())) + '/' + date.getFullYear()
}


const CollaborateUserRow = ({user, perms, isCurrentUser}) => {
	const ref = useRef();
	const [state, setState] = useState({...defaultState, ...perms, expireDate: timestampToDisplayDate(perms.expireTime)})
console.log(state)
	const checkForWarning = (user) => {
	}

	const removeAccess = () => {
		setState({...state, deleted: true})
	}

	const toggleShowExpire = () => {
		setState({...state, showExpire: !state.showExpire})
	}

	const clearExpire = () => {
		setState({...state, showExpire: false, expireDate: timestampToDisplayDate(), expireTime: null})
	}

	const changeLevel = e => {
		setState({...state, accessLevel: e.target.value})
	}
	const onExpireChange = e => {
		const d = new Date(e.target.value+"T00:00") // +"T00:00" causes JS to be interpreted in the local timezone
		const timestamp = d.getTime()/1000
		setState({...state, expireDate: timestampToDisplayDate(timestamp), expireTime: timestamp})
		console.log(state)
	}

	useClickOutside(ref, () => {
		setState({...state, showExpire: false})
	});


	return (
		<div className="user_perm">
			{state.deleted
				? <div className="removed">
					<div>Remove</div>
				</div>
				: null
			}
			<a tabIndex="0"
				onClick={removeAccess}
				className="remove">
				X
			</a>

			<div className="about">
				<img className="avatar" src={user.avatar} />

				<span className={`name ${user.is_student ? 'user_match_student' : ''}`}>
					{`${user.first} ${user.last}`}
				</span>
			</div>
			{true
					? null
					:
			<div className="demote_dialogue ng-hide" ng-show="collaborator.warning">
				<div className="arrow"></div>
				<div className="warning">
					Are you sure you want to limit <strong>your</strong> access?
				</div>
					<a ng-click="cancelDemote(collaborator)" className="no_button">
					No
				</a>
				<a ng-click="collaborator.warning = false" className="button red action_button yes_button">
					Yes
				</a>
			</div>
		}

			<div className="options">

				<select
					disabled={state.sharable==false}
					tabIndex="0"
					className="perm"
					value={state.accessLevel}
					onChange={changeLevel}
				>
					{Object.values(accessLevels).map(level =>  <option key={level.value} value={level.value}>{level.text}</option> )}
				</select>

				{isCurrentUser && state.accessLevel === PERM_FULL && state.sharable
					? <a tabIndex="0" className="remove-expiration" role="button" ng-click="removeExpires(collaborator)" ng-show="collaborator.expires">X</a>
					: null
				}
				<div className="expires">
					<span className="expire-label">Expires: </span>
					{state.showExpire
						? <span ref={ref} className="expire-date-container">
							<input type="date" value={state.expireDate} onChange={onExpireChange} />
							<span className="remove" onClick={clearExpire}>Set to Never</span>
							<span className="date-finish" onClick={toggleShowExpire}>Done</span>
							</span>
						: <span className="expire-open-button" onClick={toggleShowExpire}>{state.expireDate}</span>
					}
				</div>
			</div>
		</div>
	)
}


const MyWidgetsCollaborateDialog = ({onClose, inst, myPerms, otherUserPerms, currentUser}) => {
	const [users, setUsers] = useState({})
	const [searchText, setSearchText] = useState('')
	const [lastSearch, setLastSearch] = useState('')
	const [searchResults, setSearchResults] = useState([])
	

	const collaborator = {
		is_student: false,
		warning: false,
	} 

	useEffect(
		() => {
			const userIdsToLoad = Array.from(otherUserPerms.keys())
			fetchUsers(userIdsToLoad)
			.then(res => res.json())
			.then(_users => {
				const keyedUsers = {}
				_users.forEach(u => { keyedUsers[u.id] = u})
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
							console.log(results)
							setSearchResults(results)
							// setIsSearching(false)
						})
				}
				
			}
		}, [searchText]
	)

	const onClickMatch = (match) => {
		setSearchText('')
		setLastSearch('')
		setSearchResults([])

		if(!(match.id in users)) 
		{
			const tempUsers = users
			tempUsers[match.id] = match
			setUsers(tempUsers)
			// turns out the list doesn't use the users object, but the otherUserPerms object 
			// not sure how to edit that 
		}
		console.log(users)
	}

	return (
		<Modal onClose={onClose}>
			<div className="collaborate-modal">
				<span className="title">Collaborate with Others</span>
				<div>
					<div id="access" className="collab-container">
						<div ng-if="selected.shareable" className="list_tab_lock search_container ng-scope">
							<span className="collab_input_label">
								Add people:
							</span>
							<input 
								tabIndex="0" 
								value={searchText}
								onChange={(e) => setSearchText(e.target.value)}
								className="user_add ng-pristine ng-untouched ng-valid ng-empty" 
								type="text" 
								placeholder="Enter a Materia user's name or e-mail"/>
							{ searchResults.length !== 0
								? <div className="collab_search_list">
									{searchResults.map((match) => 
										<div
											key={match.id}
											className='collab_search_match clickable'
											onClick={() => onClickMatch(match)}>
												<img className="collab_match_avatar" src={match.avatar} />
												<p className="collab_match_name">{match.first} {match.last}</p>
										</div>
									)}
									</div>
								: null
							}
						</div>

						<div className="access_list">
							{Array.from(otherUserPerms).map(([userId, userPerms]) => {
								const user = users[userId]
								if(!user) return <div>Loading...</div>
								return <CollaborateUserRow
									key={user.id}
									user={user}
									perms={userPerms}
									isCurrentUser={currentUser.id === user.id }
								/>
							})}

						</div>
						<p className="disclaimer">
							Users with full access can edit or copy this widget and can
							add or remove people in this list.
						</p>
						<a tabIndex="0" className="cancel_button" onClick={onClose}>
							Cancel
						</a>
						<a tabIndex="0" className="action_button green save_button" ng-click="updatePermissions()">
							Save
						</a>
					</div>
				</div>
			</div>
		</Modal>
	)
}



export default MyWidgetsCollaborateDialog
