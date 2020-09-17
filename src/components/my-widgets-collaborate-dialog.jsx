import React, { useEffect, useState, useRef } from 'react'
import Modal from './modal'
import fetchOptions from '../util/fetch-options'
import useClickOutside from '../util/use-click-outside'

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


const defaultState = {
	expireDate: 'never'
}
const CollaborateUserRow = ({user, perms, isCurrentUser}) => {
	console.log(user, perms)
	const ref = useRef();
	const [state, setState] = useState(defaultState)

	const checkForWarning = (user) => {
	}

	const removeAccess = user => {
	}

	const toggleExpireDate = () => {
		setState({...state, showExpire: !state.showExpire})
	}

	const clearExpire = () => {
		setState({...state, showExpire: false, expireDate: defaultState.expireDate})
	}

	const onExpireChange = e => {
		setState({...state, expireDate: e.target.value || defaultState.expireDate})
	}

	useClickOutside(ref, () => {
		setState({...state, showExpire: false})
	});

	return (
		<div className="user_perm">
			<a tabIndex="0"
				onClick={() => {removeAccess(user)}}
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
				{/* <span className="owner">Full</span>
				<span className="undo">
					Removed
					<a>Undo</a>
				</span> */}

				<select disabled={perms.sharable==false} tabIndex="0" className="perm" value={perms.accessLevel} onChange={checkForWarning(user)}>
					{Object.values(accessLevels).map(level =>  <option key={level.value} value={level.value}>{level.text}</option> )}
				</select>

				{isCurrentUser && perms.accessLevel === PERM_FULL && perms.sharable
					? <a tabIndex="0" className="remove-expiration" role="button" ng-click="removeExpires(collaborator)" ng-show="collaborator.expires">X</a>
					: null
				}
				<div className="expires">
					<span className="expire-label">Expires: </span>
					{state.showExpire
						? <span ref={ref} className="expire-date-container">
							<input type="date" value={state.expireDate} onChange={onExpireChange} />
							<span className="remove" onClick={clearExpire}>Set to Never</span>
							<span className="date-finish" onClick={toggleExpireDate}>Done</span>
							</span>
						: <span className="expire-open-button" onClick={toggleExpireDate}>{state.expireDate}</span>
					}
				</div>
			</div>
		</div>
	)
}


const MyWidgetsCollaborateDialog = ({onClose, inst, myPerms, otherUserPerms, currentUser}) => {
	const [users, setUsers] = useState({})


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
	return (
		<Modal onClose={onClose}>
			<div className="collaborate-modal">
				<span className="title">Collaborate with Others</span>
				<div>
					<div id="access" className="container">
						<div ng-if="selected.shareable" className="list_tab_lock search_container ng-scope">
							<span className="input_label">
								Add people:
							</span>
							<input tabIndex="0" ng-model="inputs.userSearchInput" ng-model-options="{ updateOn: 'default', debounce: {'default': 400, 'blur': 0} }" ng-enter="searchMatchClick(selectedMatch)" className="user_add ng-pristine ng-untouched ng-valid ng-empty" type="text" placeholder="Enter a Materia user's name or e-mail" ng-keydown="searchKeyDown($event)"/>
							<div className="search_list ng-hide" ng-show="searchResults.show">
							</div>
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
