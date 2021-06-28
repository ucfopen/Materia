import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useQuery } from 'react-query'
import { apiGetExtraAttempts, apiGetUsers } from '../util/api'
import useSetAttempts from './hooks/useSetAttempts'
import Modal from './modal'
import ExtraAttemptsRow from './extra-attempts-row'
import LoadingIcon from './loading-icon'
import NoContentIcon from './no-content-icon'
import StudentSearch from './student-search'
import './extra-attempts-dialog.scss'

// note: this module is originally intended for the admin panel 
// and does not check user permissions

const defaultState = () => ({
	extraAttempts: new Map(),
	users: {},
	newIdCount: -1,
	userIDs: []
})

// Component for Extra Attempts Gui
const ExtraAttemptsDialog = ({onClose, inst}) => {
	// map of extra attempt objects for a particular instance
	// key: id of extra attempt row in the db
	// when creating a new row, id's are negative increments (newIdCount)
	// hold users that correlate to extra attempts
	// new attempt object Id's are negative so as not to conflict with existing Id's
	const [state, setState] = useState(defaultState())
	// display error above save button using the text from this hook:
	const [saveError, setSaveError] = useState('')
	const mounted = useRef(false)
	const setExtraAttempts = useSetAttempts()
	const { data: attempts, isLoading: attemptsLoading, isFetching, remove: removeAttempts } = useQuery({
		queryKey: 'extra-attempts',
		queryFn: () => apiGetExtraAttempts(inst.id),
		placeholderData: [],
		staleTime: Infinity
	})
	const { data: queryUsers, remove: removeUsers } = useQuery({
		queryKey: ['attempt-users', inst.id],
		queryFn: () => apiGetUsers(state.userIDs),
		enabled: !!state.userIDs && state.userIDs.length > 0 && attemptsLoading == false,
		placeholderData: {},
		staleTime: Infinity
	})

	useEffect(() => {
    mounted.current = true
    return () => (mounted.current = false)
	}, [])

	// Sets the users and attempts on load
	useEffect(() => {
		if (attempts instanceof Map && mounted.current) {
			const idArr = []
			attempts.forEach(user => {idArr.push(user.user_id)})
			setState({...state, userIDs: idArr, extraAttempts: new Map(attempts)})
		}
	}, [JSON.stringify(attempts), mounted.current])

	useEffect(() => {
		if (mounted.current) {
			setState({...state, users: {...queryUsers}})
		}
	}, [JSON.stringify(queryUsers)])

	const addUser = (match) => {
		// add user to users list if not already there
		const tempUsers = {...state.users}
		const tempAttempts = new Map(state.extraAttempts)

		if(!(match.id in state.users)){
			tempUsers[match.id] = match

			// add another extra attempts row if needed
			tempAttempts.set(
				state.newIdCount,
				{
					id: parseInt(state.newIdCount),
					context_id: '',
					extra_attempts: 1,
					user_id: parseInt(match.id)
				}
			)
		}
		else {
			// Previously deleted user being re-added
			for (const [attemptId, attemptVal] of tempAttempts) {
				if (parseInt(attemptVal.user_id) === parseInt(match.id)) {
					// Only changes when necessary
					if (attemptVal.extra_attempts < 0 || attemptVal.disabled === true) {
						tempAttempts.set(attemptId, 
							{
								...attemptVal,
								extra_attempts: 1,
								disabled: false
							}
						)
					}
					break
				}
			}
		}

		setState({...state,
			extraAttempts: tempAttempts,
			newIdCount: !(match.id in state.users) ? state.newIdCount-1 : state.newIdCount,
			users: tempUsers
		})
	}

	const onSave = () => {
		let isError = false
		state.extraAttempts.forEach((obj) => {
			if(obj.context_id === '') {
				setSaveError('Must fill in Course ID field')
				isError = true
			}
		})
		
		if (!isError) {
			setExtraAttempts.mutate({
				instId: inst.id,
				attempts: Array.from(state.extraAttempts.values())
			})

			// Removed current queries from cache to force reload on next open
			removeAttempts()
			removeUsers()

			onClose()
		}
	}

	const containsUser = useMemo(() => {
		for (const [id, val] of Array.from(state.extraAttempts)) {
			if (val.extra_attempts >= 0) return true
		}

		return false
	},[inst, Array.from(state.extraAttempts)])

	return (
		<Modal onClose={onClose}>
			<div className="extraAttemptsModal">
				<span className="title">Give Students Extra Attempts</span>
				<div className="attempts-container">
					<StudentSearch addUser={addUser} debounceTime={300}/>

					<div className="attempts_list_container">
						<div className="headers">
							<span className="user-header">User</span>
							<span className="context-header">Course ID</span>
							<span className="attempts-header">Extra Attempts</span>
						</div>

						<div className={`attempts_list ${containsUser ? '' : 'no-content'}`}>
							{
								!isFetching
								? <>
										{
											containsUser
											?	Array.from(state.extraAttempts).map(([attemptId, attemptObj]) => {
													if(attemptObj.extra_attempts < 0) return
													const user = state.users[attemptObj.user_id]
													if(!user) return
													return <ExtraAttemptsRow
														key={attemptId}
														extraAttempt={attemptObj}
														user={user}
														onChange={(id, updatedAttempt) => (setState((oldState) => {
															const attemptsMap = new Map(oldState.extraAttempts)
															attemptsMap.set(id, updatedAttempt)
															return {...oldState, extraAttempts: attemptsMap}
														}))}
													/>
												})
											: <NoContentIcon />
										}
									</>
								: <LoadingIcon />
							}
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
