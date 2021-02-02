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

// api calls for this component
const fetchUsers = (arrayOfUserIds) => fetch('/api/json/user_get', fetchOptions({body: `data=${encodeURIComponent(JSON.stringify([arrayOfUserIds]))}`}))
const searchUsers = (input) => fetch('/api/json/users_search', fetchOptions({body: `data=${encodeURIComponent(JSON.stringify([input]))}`}))
const setUserPermsForInstance = (instId, permsObj) => fetch('/api/json/permissions_set', fetchOptions({body: 'data=' + encodeURIComponent(`[4,"${instId}",${JSON.stringify(permsObj)}]`)}))

const defaultState = {
	remove: false
}

// convert time in ms to a displayable format for the component
const timestampToDisplayDate = (timestamp) => {
	if(!timestamp) return 'never'
	var date = new Date(timestamp*1000);
	return date.getFullYear() + '-' + ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '-' + ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate()))
}


const CollaborateUserRow = ({user, perms, isCurrentUser, onChange, readOnly}) => {
	const ref = useRef();
	const [state, setState] = useState({...defaultState, ...perms, expireDate: timestampToDisplayDate(perms.expireTime)})
	const [showDemoteDialog, setShowDemoteDialog] = useState(false)

	// update parent everytime local state changes
	useEffect(
		() => {
			onChange(user.id, {
				accessLevel: state.accessLevel,
				expireTime: state.expireTime,
				editable: state.editable,
				shareable: state.shareable,
				can: state.can,
				remove: state.remove
			})
		}, [state]
	)

	const checkForWarning = () => {
		if(isCurrentUser) { 
			setShowDemoteDialog(true)
		}
		else removeAccess()
	}

	const removeAccess = () => {
			setState({...state, remove: true})
			setShowDemoteDialog(false)
	}

	const toggleShowExpire = (e) => {
		if (!isCurrentUser)
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
	}

	useClickOutside(ref, () => {
		setState({...state, showExpire: false})
	});


	return (
		<div className={`user-perm ${state.remove ? "deleted" : ""}`}>
			<button tabIndex="0"
				onClick={checkForWarning}
				className="remove"
				disabled={readOnly && !isCurrentUser}>
				X
			</button>

			<div className="about">
				<img className="avatar" src={user.avatar} />

				<span className={`name ${user.is_student ? 'user-match-student' : ''}`}>
					{`${user.first} ${user.last}`}
				</span>
			</div>
			{ showDemoteDialog
				? <div className="demote-dialog">
						<div className="arrow"></div>
						<div className="warning">
							Are you sure you want to limit <strong>your</strong> access?
						</div>
						<a className="no-button" onClick={() => setShowDemoteDialog(false)}>No</a>
						<a className="button action_button yes-button" onClick={removeAccess}>Yes</a>
					</div>
				: null

			}
			<div className="options">
				<select
					disabled={readOnly}
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
							<span className="date-finish" onClick={(e) => {toggleShowExpire(e)}}>Done</span>
							</span>
						: <button className={readOnly || isCurrentUser ? 'expire-open-button-disabled' : 'expire-open-button'} onClick={(e) => {toggleShowExpire(e)}} disabled={readOnly}>{state.expireDate}</button>
					}
				</div>
			</div>
		</div>
	)
}

const MyWidgetsCollaborateDialog = ({onClose, inst, myPerms, otherUserPerms, setOtherUserPerms, currentUser}) => {
	const [users, setUsers] = useState({})
	const [searchText, setSearchText] = useState('')
	const [lastSearch, setLastSearch] = useState('')
	const [searchResults, setSearchResults] = useState([])
	const [updatedOtherUserPerms, setUpdatedOtherUserPerms] = useState({})
	const [shareNotAllowed, setShareNotAllowed] = useState(false)

	const collaborator = {
		is_student: false,
		warning: false,
	} 

	useEffect(
		() => {
			const map = new Map(otherUserPerms)
			map.forEach(key => key.remove = false)
			setUpdatedOtherUserPerms(map)
		}, [otherUserPerms]
	)

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

		if(!inst.guest_access && match.is_student){
			setShareNotAllowed(true)
			return
		}
		else setShareNotAllowed(false)

		if(!(match.id in users) || updatedOtherUserPerms.get(match.id).remove == true) 
		{
			const tempUsers = users
			tempUsers[match.id] = match
			setUsers(tempUsers)
			// turns out the list doesn't use the users object, but the otherUserPerms object 
			// not sure how to edit that 
			const tempPerms = updatedOtherUserPerms
			tempPerms.set(
				match.id, 
				{
					accessLevel: 1,
					expireTime: null,
					editable: false,
					shareable: false,
					can: {
						view: true,
						copy: false, 
						edit: false,
						delete: false, 
						share: false
					},
					remove: false
				}
			)
			setUpdatedOtherUserPerms(tempPerms)
		}
	}

	const onSave = () => {
		setUserPermsForInstance(inst.id, Array.from(updatedOtherUserPerms).map(([userId, userPerms]) => 
		{
			return {
				user_id: userId,
				expiration: userPerms.expireTime,
				perms: {[userPerms.accessLevel]: !userPerms.remove}
			}
		}))
		.then(() => {
			updatedOtherUserPerms.forEach((value, key) => {
				if(value.remove == true) updatedOtherUserPerms.delete(key)
			})
			setOtherUserPerms(updatedOtherUserPerms)
			onClose()
		})
	}

	return (
		<Modal onClose={onClose} ignoreClose={shareNotAllowed}>
			<div className="collaborate-modal">
				<span className="title">Collaborate</span>
				<div>
					<div id="access" className="collab-container">
							{ //cannot search unless you have full access
								myPerms.shareable
								? 
									<div className="search-container ng-scope">
										<span className="collab-input-label">
											Add people:
										</span>
										<input 
											tabIndex="0" 
											value={searchText}
											onChange={(e) => setSearchText(e.target.value)}
											className="user-add" 
											type="text" 
											placeholder="Enter a Materia user's name or e-mail"/>
										<div>
										{ searchResults.length !== 0
											? <div className="collab-search-list">
												{searchResults.map((match) => 
													<div
														key={match.id}
														className='collab-search-match clickable'
														onClick={() => onClickMatch(match)}>
															<img className="collab-match-avatar" src={match.avatar} />
															<p className={`collab-match-name ${match.is_student ? 'collab-match-student' : ''}`}>{match.first} {match.last}</p>
													</div>
												)}
												</div>
											: null
										}
										</div>
									</div>
								: null
							}	
						

						<div className="access-list">
							{Array.from(updatedOtherUserPerms).map(([userId, userPerms]) => {
								if(userPerms.remove == true) return
								const user = users[userId]
								if(!user) return <div key={userId}></div>
								return <CollaborateUserRow
									key={user.id}
									user={user}
									perms={userPerms}
									isCurrentUser={currentUser.id === user.id}
									onChange={(userId, perms) => updatedOtherUserPerms.set(userId, perms)}
									readOnly={myPerms.shareable == false}
								/>
							})}

						</div>
						<p className="disclaimer">
							Users with full access can edit or copy this widget and can
							add or remove people in this list.
						</p>
						<div className="btn-box">
							<a tabIndex="0" className="cancel_button" onClick={onClose}>
								Cancel
							</a>
							<a tabIndex="0" className="action_button green save_button" onClick={onSave}>
								Save
							</a>
						</div>
					</div>
				</div>
			</div>
			{ shareNotAllowed == true
				?
				<Modal onClose={() => {setShareNotAllowed(false)}} smaller={true} alert={true}>
					<span className="alert-title">Share Not Allowed</span>
					<p className="alert-description">Access must be set to "Guest Mode" to collaborate with students.</p>
					<button className="alert-btn" onClick={() => {setShareNotAllowed(false)}}>Okay</button>
				</Modal>
				:
				null
			}
		</Modal>
	)
}



export default MyWidgetsCollaborateDialog
