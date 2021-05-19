import React, { useEffect, useState, useRef } from 'react'
import Modal from './modal'
import useClickOutside from '../util/use-click-outside'
import useDebounce from './hooks/useDebounce'
import DatePicker from "react-datepicker"
import setUserInstancePerms from './hooks/useSetUserInstancePerms'
import { access } from './materia-constants'
import { useQuery, useQueryClient } from 'react-query'
import { apiGetUsers, apiSearchUsers } from '../util/api'
import './my-widgets-collaborate-dialog.scss'

const accessLevels = {
	[access.VISIBLE]: { value: access.VISIBLE, text: 'View Scores' },
	[access.FULL]: { value: access.FULL, text: 'Full' }
}

const defaultState = () => {
	return({
		remove: false,
		showDemoteDialog: false
	})
}

const initState = () => {
	return ({
		searchText: '',
		shareNotAllowed: false,
		updatedOtherUserPerms: {}
	})
}

const dateToStr = (date) => {
	if(!date) return ""
	return date.getFullYear() + '-' + ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '-' + ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate()))
}

// convert time in ms to a displayable format for the component
const timestampToDisplayDate = (timestamp) => {
	if(!timestamp) return (new Date())
	return new Date(timestamp*1000);
}

const CollaborateUserRow = ({user, perms, isCurrentUser, onChange, readOnly}) => {
	const ref = useRef();
	const [state, setState] = useState({...defaultState(), ...perms, expireDate: timestampToDisplayDate(perms.expireTime)})

	// updates parent everytime local state changes
	useEffect(() => {
		onChange(user.id, {
			accessLevel: state.accessLevel,
			expireTime: state.expireTime,
			editable: state.editable,
			shareable: state.shareable,
			can: state.can,
			remove: state.remove
		})
	}, [state])

	useClickOutside(ref, () => {
		setState({...state, showExpire: false})
	})

	const checkForWarning = () => {
		if(isCurrentUser) { 
			setState({...state, showDemoteDialog: true})
		}
		else removeAccess()
	}

	const removeAccess = () => {
			setState({...state, remove: true, showDemoteDialog: false})
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

	const onExpireChange = date => {
		const timestamp = date.getTime()/1000
		setState({...state, expireDate: date, expireTime: timestamp})
	}

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
			{ state.showDemoteDialog
				? <div className="demote-dialog">
						<div className="arrow"></div>
						<div className="warning">
							Are you sure you want to limit <strong>your</strong> access?
						</div>
						<a className="no-button" onClick={() => setState({...state, showDemoteDialog: false})}>No</a>
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
				<div className="expires">
					<span className="expire-label">Expires: </span>
					{state.showExpire
						? <span ref={ref} className="expire-date-container">
							<DatePicker
								selected={state.expireDate}
								onChange={onExpireChange}
							placeholderText="Date"/>
							<span className="remove" onClick={clearExpire}>Set to Never</span>
							<span className="date-finish" onClick={(e) => {toggleShowExpire(e)}}>Done</span>
							</span>
						: 
							state.expireTime !== null
							? <button className={readOnly || isCurrentUser ? 'expire-open-button-disabled' : 'expire-open-button'} onClick={(e) => {toggleShowExpire(e)}} disabled={readOnly}>{dateToStr(state.expireDate)}</button>
							: <button className={readOnly || isCurrentUser ? 'expire-open-button-disabled' : 'expire-open-button'} onClick={(e) => {toggleShowExpire(e)}} disabled={readOnly}>Never</button>
					}
				</div>
			</div>
		</div>
	)
}

const MyWidgetsCollaborateDialog = ({onClose, inst, myPerms, otherUserPerms, setOtherUserPerms, currentUser}) => {
	const [state, setState] = useState(initState())
	const debouncedSearchTerm = useDebounce(state.searchText, 250)
	const queryClient = useQueryClient()
	const setUserPerms = setUserInstancePerms()
	const mounted = useRef(false)
	const { data: collabUsers, remove: clearUsers} = useQuery({
		queryKey: ['collab-users', inst.id],
		enabled: !!otherUserPerms,
		queryFn: () => apiGetUsers(Array.from(otherUserPerms.keys())),
		staleTime: Infinity,
		placeholderData: {}
	})
	const { data: searchResults, remove: clearSearch, refetch: refetchSearch } = useQuery({
		queryKey: `user-search`,
		enabled: !!debouncedSearchTerm,
		queryFn: () => apiSearchUsers(debouncedSearchTerm),
		staleTime: Infinity,
		placeholderData: [],
		retry: false
	})
	
	useEffect(() => {
    mounted.current = true
    return () => {
			mounted.current = false
		}
	}, [])

	// Handles the search with debounce
	useEffect(() => {
		if(debouncedSearchTerm === '') clearSearch()
		else refetchSearch()
	}, [debouncedSearchTerm])

	// Sets Perms
	useEffect(() => {
		const map = new Map(otherUserPerms)
		map.forEach(key => key.remove = false)
		setState({...state, updatedOtherUserPerms: map})
	}, [otherUserPerms])

	// Handles clicking a search result
	const onClickMatch = (match) => {
		const tempPerms = state.updatedOtherUserPerms
		let shareNotAllowed = false

		if(!inst.guest_access && match.is_student){
			shareNotAllowed = true
			setState({...state, searchText: '', updatedOtherUserPerms: tempPerms, shareNotAllowed: shareNotAllowed})
			return
		}

		if(!(match.id in collabUsers) || state.updatedOtherUserPerms.get(match.id).remove === true) 
		{
			// Adds user to query data
			let tmpMatch = {}
			tmpMatch[match.id] = match
			queryClient.setQueryData(['collab-users', inst.id], old => ({...old, ...tmpMatch}))

			// Updateds the perms
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
		}

		setState({...state, searchText: '', updatedOtherUserPerms: tempPerms, shareNotAllowed: shareNotAllowed})
	}

	const onSave = () => {
		let isCurrUser = false
		if (state.updatedOtherUserPerms.get(currentUser.id)?.remove) {
			isCurrUser = true
		}
		
		setUserPerms.mutate({
			instId: inst.id, 
			permsObj: Array.from(state.updatedOtherUserPerms).map(([userId, userPerms]) => {
				return {
					user_id: userId,
					expiration: userPerms.expireTime,
					perms: {[userPerms.accessLevel]: !userPerms.remove}
				}
			}),
			successFunc: () => {
				if (mounted.current) {
					setOtherUserPerms(state.updatedOtherUserPerms)
					if (isCurrUser) {
						queryClient.invalidateQueries('widgets')
					}
					queryClient.invalidateQueries('search-widgets')
					queryClient.invalidateQueries(['user-perms', inst.id])
					queryClient.invalidateQueries(['user-search', inst.id])
					queryClient.removeQueries(['collab-users', inst.id])
					customClose()
				}
			}
		})

		state.updatedOtherUserPerms.forEach((value, key) => {
			if(value.remove === true) {
				state.updatedOtherUserPerms.delete(key)
			}
		})
	}

	const customClose = () => {
		clearUsers()
		clearSearch()
		onClose()
	}

	const updatePerms = (userId, perms) => {
		let newPerms = new Map(state.updatedOtherUserPerms)
		newPerms.set(userId, perms)
		setState({...state, updatedOtherUserPerms: newPerms})
	}

	return (
		<Modal onClose={customClose} ignoreClose={state.shareNotAllowed}>
			<div className="collaborate-modal">
				<span className="title">Collaborate</span>
				<div>
					<div id="access" className="collab-container">
							{ //cannot search unless you have full access
								myPerms?.shareable
								? 
									<div className="search-container">
										<span className="collab-input-label">
											Add people:
										</span>
										<input 
											tabIndex="0" 
											value={state.searchText}
											onChange={(e) => setState({...state, searchText: e.target.value})}
											className="user-add" 
											type="text" 
											placeholder="Enter a Materia user's name or e-mail"/>
										<div>
										{ debouncedSearchTerm !== '' && searchResults && searchResults?.length !== 0
											? <div className="collab-search-list">
												{searchResults?.map((match) => 
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
							{
								Array.from(state.updatedOtherUserPerms).map(([userId, userPerms]) => {
									if(userPerms.remove === true) return
									const user = collabUsers[userId]
									if(!user) return <div key={userId}></div>
									return <CollaborateUserRow
										key={user.id}
										user={user}
										perms={userPerms}
										isCurrentUser={currentUser.id === user.id}
										onChange={(userId, perms) => updatePerms(userId, perms)}
										readOnly={myPerms?.shareable === false}
									/>
								})
							}
						</div>
						<p className="disclaimer">
							Users with full access can edit or copy this widget and can
							add or remove people in this list.
						</p>
						<div className="btn-box">
							<a tabIndex="0" className="cancel_button" onClick={customClose}>
								Cancel
							</a>
							<a tabIndex="0" className="action_button green save_button" onClick={onSave}>
								Save
							</a>
						</div>
					</div>
				</div>
			</div>
			{ state.shareNotAllowed === true
				? <Modal onClose={() => {setState({...state, shareNotAllowed: false})}} smaller={true} alert={true}>
					<span className="alert-title">Share Not Allowed</span>
					<p className="alert-description">Access must be set to "Guest Mode" to collaborate with students.</p>
					<button className="alert-btn" onClick={() => {setState({...state, shareNotAllowed: false})}}>Okay</button>
				</Modal>
				: null
			}
		</Modal>
	)
}

export default MyWidgetsCollaborateDialog
