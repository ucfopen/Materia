import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { apiGetUsers } from '../util/api'
import setUserInstancePerms from './hooks/useSetUserInstancePerms'
import Modal from './modal'
import useDebounce from './hooks/useDebounce'
import LoadingIcon from './loading-icon'
import NoContentIcon from './no-content-icon'
import CollaborateUserRow from './my-widgets-collaborate-user-row'
import './my-widgets-collaborate-dialog.scss'
import { access } from './materia-constants'
import useUserList from './hooks/useUserList'

const initDialogState = (state) => {
	return ({
		searchText: '',
		shareNotAllowed: false,
		updatedAllUserPerms: new Map()
	})
}

const MyWidgetsCollaborateDialog = ({onClose, inst, myPerms, otherUserPerms, setOtherUserPerms, currentUser, setInvalidLogin}) => {
	const [state, setState] = useState(initDialogState())
	const debouncedSearchTerm = useDebounce(state.searchText, 250)
	const queryClient = useQueryClient()
	const setUserPerms = setUserInstancePerms()
	const [error, setError] = useState('')
	const mounted = useRef(false)
	const popperRef = useRef(null)
	const userList = useUserList(debouncedSearchTerm)
	const [collabUsers, setCollabUsers] = useState({})

	const { data, remove: clearUsers, isFetching} = useQuery({
		queryKey: ['collab-users', inst.id, (otherUserPerms != null ? Array.from(otherUserPerms.keys()) : otherUserPerms)], // check for changes in otherUserPerms
		enabled: !!otherUserPerms && Array.from(otherUserPerms.keys()).length > 0,
		queryFn: () => apiGetUsers(Array.from(otherUserPerms.keys())),
		staleTime: Infinity,
		placeholderData: {},
		retry: false,
		onSuccess: (data) => {
			setCollabUsers({...collabUsers, ...data})
		},
		onError: (err) => {
			if (err.message == "Invalid Login")
			{
				setInvalidLogin(true)
				customClose()
			} else {
				setError("Failed to load users")
			}
		}
	})

	useEffect(() => {
		if (userList.error) {
			setError(`User search failed with error: ${data.msg}`);
			if (userList.error.title == "Invalid Login")
			{
				setInvalidLogin(true)
			}
		}
	}, [userList.error])

	useEffect(() => {
		mounted.current = true
		return () => {
			mounted.current = false
		}
	}, [])

	// updatedAllUserPerms is assigned the value of otherUserPerms (a read-only prop) when the component loads
	useEffect(() => {
		if (otherUserPerms != null)
		{
			const map = new Map([...state.updatedAllUserPerms, ...otherUserPerms])
			map.forEach((key, pair) => {
				key.remove = false
			})
			setState({...state, updatedAllUserPerms: map})
		}
	}, [otherUserPerms])

	// Handles clicking a search result
	const onClickMatch = match => {
		const tempPerms = new Map(state.updatedAllUserPerms)
		let shareNotAllowed = false

		if(!inst.guest_access && match.is_student && !match.is_support_user){
			shareNotAllowed = true
			setState({...state, searchText: '', updatedAllUserPerms: tempPerms, shareNotAllowed: shareNotAllowed})
			return
		}

		if(!state.updatedAllUserPerms.get(match.id) || state.updatedAllUserPerms.get(match.id).remove === true)
		{
			// Adds user to query data
			let tmpMatch = {}
			tmpMatch[match.id] = match
			queryClient.setQueryData(['collab-users', inst.id], old => ({...old, ...tmpMatch}))
			if (!collabUsers[match.id])
			{
				setCollabUsers({...collabUsers, [match.id]: match})
			}

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

		setState({...state,
			searchText: '',
			updatedAllUserPerms: tempPerms,
			shareNotAllowed: shareNotAllowed
		})
	}

	// does the perms set contain the current user?
	// supportUsers always have implicit access. Otherwise, verify the user is in the perms set and isn't pending removal.
	const containsUser = () => {
		if (myPerms?.isSupportUser) return true
		for (const [id, val] of Array.from(state.updatedAllUserPerms)) {
			if (id == currentUser.id) return !val.remove
		}
		return false
	}

	const onSave = () => {
		let delCurrUser = false
		if (state.updatedAllUserPerms.get(currentUser.id)?.remove) {
			delCurrUser = true
		}

		let permsObj = [];

		if (delCurrUser && myPerms.accessLevel != access.FULL)
		{
			// Only send a request to update current user perms so that it doesn't get no-perm'd by the server
			let currentUserPerms = state.updatedAllUserPerms.get(currentUser.id);
			permsObj.push({
				user_id: currentUser.id,
				expiration: currentUserPerms.expireTime,
				perms: {[currentUserPerms.accessLevel]: !currentUserPerms.remove}
			})
		}
		else
		{
			// else send a request to update all perms
			permsObj = Array.from(state.updatedAllUserPerms).map(([userId, userPerms]) => {
				return {
					user_id: userId,
					expiration: userPerms.expireTime,
					perms: {[userPerms.accessLevel]: !userPerms.remove}
				}
			})
		}

		setUserPerms.mutate({
			instId: inst.id,
			permsObj: permsObj,
			successFunc: (data) => {
				if (mounted.current) {
					if (delCurrUser) {
						queryClient.invalidateQueries('widgets')
					}
					queryClient.invalidateQueries('search-widgets')
					queryClient.invalidateQueries(['user-perms', inst.id])
					queryClient.invalidateQueries(['user-search', inst.id])
					queryClient.removeQueries(['collab-users', inst.id])

					setOtherUserPerms(state.updatedAllUserPerms)
					customClose()
				}
			},
			errorFunc: (err) => {
				if (err.message == "Share Not Allowed")
				{
					setState({...state, shareNotAllowed: true})
				} else if (err.message == "Invalid Login")
				{
					setInvalidLogin(true)
				} else {
					setError((err.message || "Error") + ": Failed to save permissions.")
				}
			}
		})

		let tmpPerms = new Map(state.updatedAllUserPerms)

		tmpPerms.forEach((value, key) => {
			if(value.remove === true) {
				tmpPerms.delete(key)
			}
		})

		setState({...state, updatedAllUserPerms: tmpPerms})
	}

	const customClose = () => {
		clearUsers()
		onClose()
	}

	const updatePerms = (userId, perms) => {
		let newPerms = new Map(state.updatedAllUserPerms)
		newPerms.set(parseInt(userId), perms)
		setState({...state, updatedAllUserPerms: newPerms})
	}

	// Can't search unless you have full access.
	let searchContainerRender = null
	if (myPerms?.shareable || myPerms?.isSupportUser) {
		let searchResultsRender = null
		if (debouncedSearchTerm !== '' && state.searchText !== '' && userList.users?.length && userList.users?.length !== 0) {
			const searchResultElements = userList.users?.map(match =>
				<div key={match.id}
					className='collab-search-match clickable'
					onClick={() => onClickMatch(match)}>
					<img className='collab-match-avatar' src={match.avatar} alt="user avatar" />
					<p className={`collab-match-name ${match.is_student ? 'collab-match-student' : ''}`}>
						{match.first_name} {match.last_name}
					</p>
				</div>
			)

			searchResultsRender = (
				<div className='collab-search-list'>
					{ searchResultElements }
				</div>
			)
		}

		searchContainerRender = (
			<div className='search-container'>
				<span className='collab-input-label'>
					Add people:
				</span>
				<input
					tabIndex='0'
					value={state.searchText}
					onChange={(e) => setState({...state, searchText: e.target.value})}
					className='user-add'
					type='text'
					placeholder="Enter a Materia user's name or e-mail"/>
				{ searchResultsRender }
			</div>
		)
	}

	let mainContentRender = <LoadingIcon />
	if (!isFetching) {
		mainContentRender = <NoContentIcon />

		if (containsUser) {
			const mainContentElements = Array.from(state.updatedAllUserPerms).map(([userId, userPerms]) => {
				if (userPerms.remove === true) return

				let user = collabUsers[userId]
				if (!user)
				{
					return <div key={userId}></div>
				}

				if (user.id == inst.user_id) {
					user.is_owner = true;
				} else {
					user.is_owner = false;
				}

				return <CollaborateUserRow
					key={user.id}
					user={user}
					perms={userPerms}
					myPerms={myPerms}
					isCurrentUser={currentUser.id === user.id}
					onChange={(userId, perms) => updatePerms(userId, perms)}
					readOnly={myPerms?.shareable === false}
				/>
			})

			mainContentRender = (
				<>
					{ mainContentElements }
				</>
			)
		}
	}

	const disableShareNotAllowed = () => setState({...state, shareNotAllowed: false})
	let noShareWarningRender = null
	if (state.shareNotAllowed === true) {
		noShareWarningRender = (
			<Modal onClose={disableShareNotAllowed} smaller={true} alert={true}>
				<div>
					<span className='alert-title'>Share Not Allowed</span>
					<p className='alert-description'>Access must be set to "Guest Mode" to collaborate with students.</p>
					<button className='action_button' onClick={disableShareNotAllowed}>Okay</button>
				</div>
			</Modal>
		)
	}

	let errorRender = null
	if (error) {
		errorRender = (
			<div className='error'>
				<p>{error}</p>
			</div>
		)
	}

	return (
		<Modal onClose={customClose}
			ignoreClose={state.shareNotAllowed}>
			<div className='collaborate-modal' ref={popperRef}>
				<span className='title'>Collaborate</span>
				{ errorRender }
				<div id='access' className='collab-container'>
					{ searchContainerRender }
					<div className={`access-list ${containsUser ? '' : 'no-content'}`}>
						{ mainContentRender }
					</div>
					{/* Calendar portal used to bring calendar popup out of access-list to avoid cutting off the overflow */}
					<div id='calendar-portal' />
					<p className='disclaimer'>
						Users with full access can edit or copy this widget and can
						add or remove people in this list.
					</p>
					<div className='btn-box'>
						<a tabIndex='0'
							className='cancel_button'
							onClick={customClose}>
							Cancel
						</a>
						<a tabIndex='0'
							className='action_button green save_button'
							onClick={onSave}>
							Save
						</a>
					</div>
				</div>
			</div>
			{ noShareWarningRender }
		</Modal>
	)
}

export default MyWidgetsCollaborateDialog