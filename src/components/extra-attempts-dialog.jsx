import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGetExtraAttempts, apiGetUsers } from '../util/api'
import { useCreateExtraAttempts, useDeleteExtraAttempts, useUpdateExtraAttempts } from './hooks/useExtraAttempts'
import Modal from './modal'
import ExtraAttemptsRow from './extra-attempts-row'
import LoadingIcon from './loading-icon'
import NoContentIcon from './no-content-icon'
import StudentSearch from './student-search'
import './extra-attempts-dialog.scss'

// note: this module is originally intended for the admin panel
// and does not check user permissions

const defaultState = () => ({
	extraAttempts: [],
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
	const [error, setError] = useState('')
	const mounted = useRef(false)
	const createExtraAttempts = useCreateExtraAttempts()
	const deleteExtraAttempts = useDeleteExtraAttempts()
	const updateExtraAttempts = useUpdateExtraAttempts()
	const { data: attempts, isLoading: attemptsLoading, isFetching, remove: removeAttempts, error: attemptsError } = useQuery({
		queryKey: 'extra-attempts',
		queryFn: () => apiGetExtraAttempts(inst.id),
		placeholderData: [],
		staleTime: Infinity
	})
	const { data: queryUsers, remove: removeUsers, error: usersError } = useQuery({
		queryKey: ['attempt-users', inst.id],
		queryFn: () => apiGetUsers(state.userIDs),
		enabled: !!state.userIDs && state.userIDs.length > 0 && attemptsLoading == false,
		placeholderData: {},
		staleTime: Infinity
	})

	useEffect(() => {
		[usersError, attemptsError].some((someErr) => {
			switch (someErr.status) {
				case 401:
					window.location.href = '/login'
					break
				default:
					if (someErr == usersError)
						setError((err.message || "Error") + ": Failed to retrieve user(s).")
					else if (someErr == attemptsError)
						setError((err.message || "Error") + ": Failed to retrieve extra attempts.")
			}
		})
	}, [usersError, attemptsError])

	useEffect(() => {
		mounted.current = true
		return () => (mounted.current = false)
	}, [])

	// Sets the users and attempts on load
	useEffect(() => {
		if (attempts !== null && mounted.current) {
			const idArr = []
			attempts.forEach(user => {idArr.push(user.user) })
			setState({...state, userIDs: idArr, extraAttempts: attempts })
		}
	}, [JSON.stringify(attempts), mounted.current])

	useEffect(() => {
		if (mounted.current) {
			setState({...state, users: {...queryUsers }})
		}
	}, [JSON.stringify(queryUsers)])

	const addUser = (match) => {
		// add user to users list if not already there
		const tempUsers = {...state.users}
		const tempAttempts = [...state.extraAttempts]

		if ( !(match.id in state.users)){
			tempUsers[match.id] = match

			// add another extra attempts row if needed
			tempAttempts.push(
				{
					id: state.newIdCount,
					context_id: "",
					extra_attempts: 1,
					instance: inst.id,
					user: parseInt(match.id),
				}
			)
		}
		else {
			// Previously deleted user being re-added
			for (const [attemptIndex, attemptVal] of tempAttempts) {
				if (parseInt(attemptVal.user) === parseInt(match.id)) {
					// Only changes when necessary
					if (attemptVal.extra_attempts < 0 || attemptVal.disabled === true) {
						tempAttempts[attemptIndex] = {
							...attemptVal,
							extra_attempts: 1,
							disabled: false
						}
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

		const mutateOptions = {
			onSuccess: (data) => {},
			onError: (err) => {}
		}

		state.extraAttempts.forEach((obj) => {
			const cleanObj = { ...obj }
			delete cleanObj.disabled

			// Check if this needs to be deleted
			if ((obj?.disabled || obj.extra_attempts < 0) && 'id' in obj) {
				deleteExtraAttempts.mutate(obj.id, mutateOptions)
			}
			// Check if this is new
			else if (obj.id < 0 && !obj?.disabled && obj.extra_attempts > 0) {
				delete cleanObj.id
				createExtraAttempts.mutate(cleanObj, mutateOptions)
			}
			// Otherwise, this just need to be updated
			else {
				updateExtraAttempts.mutate(cleanObj, mutateOptions)
			}
		})

		// Removed current queries from cache to force reload on next open
		removeAttempts()
		removeUsers()

		onClose()
	}

	const containsUser = useMemo(() => {
		for (const val of state.extraAttempts) {
			if (val.extra_attempts >= 0) return true
		}

		return false
	}, [inst, state.extraAttempts])

	let contentRender = <LoadingIcon />
	if (!isFetching) {
		let extraAttemptsRender = <NoContentIcon />
		if (containsUser) {
			extraAttemptsRender = state.extraAttempts.map((attemptObj) => {
				if (attemptObj.extra_attempts < 0) return
				const user = state.users[attemptObj.user]
				if (!user) return

				const attemptsForUserChangeHandler = (id, updatedAttempt) => setState((oldState) => {
					const attempts = [...oldState.extraAttempts]
					const updatedAttemptIndex = attempts.findIndex(attempt => attempt.id === id)
					attempts[updatedAttemptIndex] = updatedAttempt
					return {
						...oldState,
						extraAttempts: attempts
					}
				})

				return <ExtraAttemptsRow
					key={attemptObj.id}
					extraAttempt={attemptObj}
					user={user}
					onChange={attemptsForUserChangeHandler}
				/>
			})
		}

		contentRender = (
			<>
				{ extraAttemptsRender }
			</>
		)
	}

	let saveErrorRender = null
	if (saveError) {
		saveErrorRender = <p>{saveError}</p>
	}

	let errorRender = null
	if (error) {
		errorRender = <p class="attempts_search_error">{error}</p>
	}

	return (
		<Modal onClose={onClose}>
			<div className='extraAttemptsModal'>
				<span className='title'>Give Students Extra Attempts</span>
				<div className='attempts-container'>
					{ errorRender }
					<StudentSearch addUser={addUser} debounceTime={300} setError={setError}/>

					<div className='attempts_list_container'>
						<div className='headers'>
							<span className='user-header'>User</span>
							<span className='context-header'>Course ID</span>
							<span className='attempts-header'>Extra Attempts</span>
						</div>

						<div className={`attempts_list ${containsUser ? '' : 'no-content'}`}>
							{ contentRender }
						</div>
					</div>
					<div className='save-error'>
						{ saveErrorRender }
					</div>
					<div className='button-holder'>
						<a tabIndex='1' className='cancel_button' onClick={onClose}>
								Cancel
						</a>
						<a tabIndex='2' className='action_button green save_button' onClick={onSave}>
							Save
						</a>
					</div>
				</div>
			</div>
		</Modal>
	)
}

export default ExtraAttemptsDialog
