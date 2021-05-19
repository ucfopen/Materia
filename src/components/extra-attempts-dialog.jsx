import React, { useEffect, useState, useRef } from 'react'
import { useQuery } from 'react-query'
import { apiGetExtraAttempts, apiGetUsers } from '../util/api'
import useSetAttempts from './hooks/useSetAttempts'
import Modal from './modal'
import ExtraAttemptsRow from './extra-attempts-row'
import './extra-attempts-dialog.scss'
import StudentSearch from './student-search'

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

	const { data: attempts, isLoading: attemptsLoading, remove: removeAttempts } = useQuery({
		queryKey: 'extra-attempts',
		queryFn: () => apiGetExtraAttempts(inst.id),
		placeholderData: [],
		staleTime: Infinity
	})
	const { data: queryUsers, remove: removeUsers } = useQuery({
		queryKey: `attempt-users-${inst.id}`,
		enabled: !!state.userIDs && state.userIDs.length > 0 && attemptsLoading == false,
		queryFn: () => apiGetUsers(state.userIDs),
		placeholderData: {},
		staleTime: Infinity
	})
	const setExtraAttempts = useSetAttempts()

	useEffect(() => {
    mounted.current = true
    return () => (mounted.current = false)
	}, [])

	// set the hooks on initial load
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
		const tempUsers = state.users
		if(!(match.id in state.users)){
			tempUsers[match.id] = match
		}

		// add another extra attempts row
		const tempAttempts = state.extraAttempts
		tempAttempts.set(
			state.newIdCount,
			{
				id: parseInt(state.newIdCount),
				context_id: '',
				extra_attempts: 1,
				user_id: parseInt(match.id)
			}
		)

		const idArr = []
		attempts.forEach(user => {idArr.push(user.user_id)})

		setState({...state,
			extraAttempts: tempAttempts,
			newIdCount: state.newIdCount-1,
			users: tempUsers,
			userIDs: idArr
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

						<div className="attempts_list">
							{Array.from(state.extraAttempts).map(([attemptId, attemptObj]) => {
								if(attemptObj.extra_attempts < 0) return
								const user = state.users[attemptObj.user_id]
								if(!user) return <div key={attemptId}>Loading...</div>
								return <ExtraAttemptsRow
									key={attemptId}
									extraAttempt={attemptObj}
									user={user}
									onChange={(id, updatedAttempts) => state.extraAttempts.set(id, updatedAttempts)}
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
