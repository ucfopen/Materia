import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { apiGetUsers, apiSearchUsers } from '../util/api'
import setUserInstancePerms from './hooks/useSetUserInstancePerms'
import Modal from './modal'
import useDebounce from './hooks/useDebounce'
import LoadingIcon from './loading-icon'
import NoContentIcon from './no-content-icon'
import CollaborateUserRow from './my-widgets-collaborate-user-row'
import './my-widgets-collaborate-dialog.scss'

const initDialogState = () => {
	return ({
		searchText: '',
		shareNotAllowed: false,
		updatedOtherUserPerms: new Map()
	})
}

const MyWidgetsCollaborateDialog = ({onClose, inst, myPerms, otherUserPerms, setOtherUserPerms, currentUser}) => {
	const [state, setState] = useState(initDialogState())
	const debouncedSearchTerm = useDebounce(state.searchText, 250)
	const queryClient = useQueryClient()
	const setUserPerms = setUserInstancePerms()
	const mounted = useRef(false)
	const popperRef = useRef(null)
	const { data: collabUsers, remove: clearUsers, isFetching} = useQuery({
		queryKey: ['collab-users', inst.id],
		enabled: !!otherUserPerms,
		queryFn: () => apiGetUsers(Array.from(otherUserPerms.keys())),
		staleTime: Infinity,
		placeholderData: {}
	})
	const { data: searchResults, remove: clearSearch, refetch: refetchSearch } = useQuery({
		queryKey: 'user-search',
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
	const onClickMatch = match => {
		const tempPerms = new Map(state.updatedOtherUserPerms)
		let shareNotAllowed = false

		if(!inst.guest_access && match.is_student){
			shareNotAllowed = true
			setState({...state, searchText: '', updatedOtherUserPerms: tempPerms, shareNotAllowed: shareNotAllowed})
			return
		}

		if(!state.updatedOtherUserPerms.get(match.id) || state.updatedOtherUserPerms.get(match.id).remove === true)
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

		setState({...state,
			searchText: '',
			updatedOtherUserPerms: tempPerms,
			shareNotAllowed: shareNotAllowed
		})
	}

	const containsUser = useMemo(() => {
		if (myPerms?.isSupportUser) return true
		for (const [id, val] of Array.from(state.updatedOtherUserPerms)) {
			if(val.remove === false) return true
		}

		return false
	},[inst, Array.from(state.updatedOtherUserPerms)])

	const onSave = () => {
		let delCurrUser = false
		if (state.updatedOtherUserPerms.get(currentUser.id)?.remove) {
			delCurrUser = true
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
					if (delCurrUser) {
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

		let tmpPerms = new Map(state.updatedOtherUserPerms)

		tmpPerms.forEach((value, key) => {
			if(value.remove === true) {
				tmpPerms.delete(key)
			}
		})

		setState({...state, updatedOtherUserPerms: tmpPerms})
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

	// Can't search unless you have full access.
	let searchContainerRender = null
	if (myPerms?.shareable || myPerms?.isSupportUser) {
		let searchResultsRender = null
		if (debouncedSearchTerm !== '' && state.searchText !== '' && searchResults && searchResults?.length !== 0) {
			const searchResultElements = searchResults?.map(match =>
				<div key={match.id}
					className='collab-search-match clickable'
					onClick={() => onClickMatch(match)}>
					<img className='collab-match-avatar' src={match.avatar} />
					<p className={`collab-match-name ${match.is_student ? 'collab-match-student' : ''}`}>
						{match.first} {match.last}
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
				<div>
					{ searchResultsRender }
				</div>
			</div>
		)
	}

	let mainContentRender = <LoadingIcon />
	if (!isFetching) {
		mainContentRender = <NoContentIcon />

		if (containsUser) {
			const mainContentElements = Array.from(state.updatedOtherUserPerms).map(([userId, userPerms]) => {
				if (userPerms.remove === true) return

				const user = collabUsers[userId]
				if (!user) return <div key={userId}></div>

				return <CollaborateUserRow
					key={user.id}
					user={user}
					perms={userPerms}
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
				<span className='alert-title'>Share Not Allowed</span>
				<p className='alert-description'>Access must be set to "Guest Mode" to collaborate with students.</p>
				<button className='alert-btn' onClick={disableShareNotAllowed}>Okay</button>
			</Modal>
		)
	}

	return (
		<Modal onClose={customClose}
			ignoreClose={state.shareNotAllowed}>
			<div className='collaborate-modal' ref={popperRef}>
				<span className='title'>Collaborate</span>
				<div>
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
			</div>
			{ noShareWarningRender }
		</Modal>
	)
}

export default MyWidgetsCollaborateDialog
