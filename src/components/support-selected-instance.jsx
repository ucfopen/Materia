import React, { useState, useEffect } from 'react'
import { apiGetUsers, apiGetUserPermsForInstance } from '../util/api'
import { useQuery } from 'react-query'
import { iconUrl } from '../util/icon-url'
import rawPermsToObj from '../util/raw-perms-to-object'
import useDeleteWidget from './hooks/useSupportDeleteWidget'
import useUnDeleteWidget from './hooks/useSupportUnDeleteWidget'
import useUpdateWidget from './hooks/useSupportUpdateWidget'
import MyWidgetsCopyDialog from './my-widgets-copy-dialog'
import MyWidgetsCollaborateDialog from './my-widgets-collaborate-dialog'
import ExtraAttemptsDialog from './extra-attempts-dialog'
import MyWidgetsScores from './my-widgets-scores'
import Alert from './alert'

const addZero = i => `${i}`.padStart(2, '0')

const objToDateString = date => {
	let dateObj = new Date(date)
	return `${dateObj.getFullYear()}-${addZero(dateObj.getMonth() + 1)}-${addZero(dateObj.getDate())}`
}

const objToTimeString = time => {
	let date = new Date(time)
	return `${addZero(date.getHours())}:${addZero(date.getMinutes())}`
}

const stringToDateObj = (date, time) => Date.parse(date + 'T' + time) / 1000

const stringToBoolean = s => s === 'true'

const SupportSelectedInstance = ({inst, currentUser, onCopySuccess, embed = false}) => {
	const [updatedInst, setUpdatedInst] = useState({...inst})
	const [showCopy, setShowCopy] = useState(false)
	const [showCollab, setShowCollab] = useState(false)
	const [showAttempts, setShowAttempts] = useState(false)
	const [showScoreDetails, setShowScoreDetails] = useState(false)
	const [availableDisabled, setAvailableDisabled] = useState(inst.open_at == null)
	const [availableDate, setAvailableDate] = useState(inst.open_at == null ? '' : objToDateString(inst.open_at))
	const [availableTime, setAvailableTime] = useState(inst.open_at == null ? '' : objToTimeString(inst.open_at))
	const [closeDisabled, setCloseDisabled] = useState(inst.close_at == null)
	const [closeDate, setCloseDate] = useState(inst.close_at == null ? '' : objToDateString(inst.close_at))
	const [closeTime, setCloseTime] = useState(inst.close_at == null ? '' : objToTimeString(inst.close_at))
	const [errorText, setErrorText] = useState('')
	const [successText, setSuccessText] = useState('')
	const [invalidLogin, setInvalidLogin] = useState(false)
	const [allPerms, setAllPerms] = useState({myPerms: null, otherUserPerms: null})
	const deleteWidget = useDeleteWidget()
	const unDeleteWidget = useUnDeleteWidget()
	const updateWidget = useUpdateWidget()

	const [alertDialog, setAlertDialog] = useState({
		enabled: false,
		message: '',
		title: 'Failure',
		fatal: false,
		enableLoginButton: false
	})

	const { data: instOwner, isFetching: loadingInstOwner } = useQuery({
		queryKey: ['instance-owner', inst.id],
		queryFn: () => apiGetUsers([updatedInst.user_id]),
		enabled: !!updatedInst && !!updatedInst.user_id,
		staleTime: Infinity
	})

	const { data: perms, isFetching: loadingPerms} = useQuery({
		queryKey: ['user-perms', inst.id],
		queryFn: () => apiGetUserPermsForInstance(inst.id),
		enabled: !!inst && inst.id !== undefined,
		placeholderData: null,
		staleTime: Infinity,
		retry: false,
		onError: (err) => {
			setAlertDialog({
				enabled: true,
				message: err.cause,
				title: err.message,
				fatal: err.halt,
				enableLoginButton: false
			})
		}
	})

	// hook associated with the invalidLogin error
	useEffect(() => {
		if (invalidLogin) {
			setAlertDialog({
				enabled: true,
				message: 'You must be logged in to edit widgets.',
				title: 'Login Required',
				fatal: true,
				enableLoginButton: true
			})
		}
	}, [invalidLogin])

	useEffect(() => {
		if (perms) {
			const isEditable = inst.widget.is_editable
			const othersPerms = new Map()
			const myPerms = new Map()
			for(const perm in perms){
				
				if (perm.user == currentUser?.id) {
					myPerms.set(perm.user, rawPermsToObj(perm, isEditable))
				}
				else {
					othersPerms.set(perm.user, rawPermsToObj(perm, isEditable))
				}
			}
			myPerms.isSupportUser = true

			setAllPerms({myPerms: myPerms, otherUserPerms: othersPerms})
		}
	}, [perms])

	const handleChange = (attr, value) => {
		setUpdatedInst({...updatedInst, [attr]: value })
	}

	const onDelete = instId => {
		deleteWidget.mutate({
			instId: instId,
			successFunc: () => setUpdatedInst({...updatedInst, is_deleted: true}),
			errorFunc: (err) => {
				setErrorText(('Error' || err.message)  + ': Delete Unsuccessful')
				setSuccessText('')
				if (err.message == "Invalid Login") {
					setInvalidLogin(true)
				}
			}
		})
	}

	const onUndelete = instId => {
		unDeleteWidget.mutate({
			instId: instId,
			successFunc: () => setUpdatedInst({...updatedInst, is_deleted: false}),
			errorFunc: (err) => {
				setErrorText(('Error' || err.message)  + ': Un-delete Unsuccessful')
				setSuccessText('')
				if (err.message == "Invalid Login") {
					setInvalidLogin(true)
				}
			}
		})
	}

	const applyChanges = () => {
		setErrorText('')
		setSuccessText('')
		let u = updatedInst

		if (!availableDisabled && !closeDisabled)
		{
			if(availableDate == '' || availableTime == '' || closeDate == '' || closeTime == '') {
				setErrorText('Please enter valid dates and times')
				return
			}

			if (stringToDateObj(availableDate, availableTime) > stringToDateObj(closeDate, closeTime))
			{
				setErrorText('Please enter a close date after the available date.')
				return
			}
		}

		// set date and time from input boxes
		if (!availableDisabled) {
			if(availableDate == '' || availableTime == '') {
				setErrorText('Please enter valid dates and times')
				return
			}
			else {
				u.open_at = new Date(`${availableDate} ${availableTime}`).toISOString()
			}
			setUpdatedInst({...updatedInst,
				'open_at': new Date(`${availableDate} ${availableTime}`).toISOString()
			})
		}
		if (!closeDisabled){
			if(closeDate == '' || closeTime == '') {
				setErrorText('Please enter valid dates and times')
				return
			}
			else {
				u.close_at = new Date(`${closeDate} ${closeTime}`).toISOString()
			}
			setUpdatedInst({...updatedInst,
				'close_at': new Date(`${closeDate} ${closeTime}`).toISOString()
			})
		}

		//make sure title is not blank
		if (u.name == '' || u.name == null){
			setErrorText('Name cannot be blank')
			return
		}


		const args = {
			id: u.id,
			name: u.name,
			open_at: u.open_at,
			close_at: u.close_at,
			attempts: u.attempts,
			guest_access: u.guest_access,
			embedded_only: u.embedded_only,
		}

		updateWidget.mutate({
			args: args,
			successFunc: () => {
				setSuccessText('Widget Updated Successfully')
				setErrorText('')
			},
			errorFunc: (err) => {
				setErrorText(('Error' || err.message)  + ': Update failed.')
				setSuccessText('')
				if (err.message == "Invalid Login") {
					setInvalidLogin(true)
				} else {
					setAlertDialog({
						enabled: true,
						message: err.cause,
						title: err.message,
						fatal: err.halt,
						enableLoginButton: false
					})
				}
			}
		})
	}

	let copyDialogRender = null
	if (showCopy) {
		copyDialogRender = (
			<MyWidgetsCopyDialog
				inst={updatedInst}
				name={updatedInst.name}
				onClose={() => setShowCopy(false)}
				onCopySuccess={(newInst) => {
					setShowCopy(false)
					// window.location.hash = newInst.id
					onCopySuccess(newInst)
				}}
				onCopyError={(err) => {
					if (err.message == "Invalid Login") {
						setInvalidLogin(true)
					}
				}}
			/>
		)
	}

	let collaborateDialogRender = null
	if (showCollab) {
		collaborateDialogRender = (
			<MyWidgetsCollaborateDialog inst={inst}
				currentUser={currentUser}
				myPerms={allPerms.myPerms}
				otherUserPerms={allPerms.otherUserPerms}
				setOtherUserPerms={(p) => setAllPerms({...allPerms, otherUserPerms: p})}
				onClose={() => {setShowCollab(false)}}
			/>
		)
	}

	let extraAttemptsDialogRender = null
	if (showAttempts) {
		extraAttemptsDialogRender = (
			<ExtraAttemptsDialog
				onClose={() => setShowAttempts(false)}
				inst={inst}
			/>
		)
	}

	let breadcrumbContainer = null
	if (!embed) {
		breadcrumbContainer =
			<div id="breadcrumb-container">
				<div className="breadcrumb">
					<a href="/admin/instance">Instance Search</a>
				</div>
				<svg xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24">
					<path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
					<path fill="none" d="M0 0h24v24H0V0z"/>
				</svg>
				<div className="breadcrumb">{updatedInst.name}</div>
			</div>
	}

	let scoresContainer = null
	if (showScoreDetails) {
		scoresContainer = <MyWidgetsScores inst={inst} beardMode={false} />
	}

	let alertDialogRender = null
	if (alertDialog.enabled) {
		alertDialogRender = (
			<Alert
				msg={alertDialog.message}
				title={alertDialog.title}
				fatal={alertDialog.fatal}
				showLoginButton={alertDialog.enableLoginButton}
				onCloseCallback={() => {
					setAlertDialog({...alertDialog, enabled: false})
				}} />
		)
	}

	return (
		<>
			{ alertDialogRender }
			<section className='page inst-info'>
				{ breadcrumbContainer }
				<div className='instance-management'>
					<div className='header'>
					<img src={iconUrl('/widget/', updatedInst.widget.dir, 60)} />
					<input type='text' value={updatedInst.name}
						onChange={event => handleChange('name', event.target.value)}
					/>
				</div>
				<div className='inst-action-buttons'>
					<button className='action_button'
						onClick={() => {window.location = `/widgets/${updatedInst.widget.dir}create#${updatedInst.id}`}}>
						<span>Edit Widget</span>
					</button>
					<button className='action_button'
						onClick={() => setShowCopy(true)}>
						<span>Make a Copy</span>
					</button>
					<button className='action_button'
						onClick={() => setShowCollab(true)}
						disabled={updatedInst.is_deleted}>
						<span title={updatedInst.is_deleted ? 'cannot collab on deleted instance' : null}>
							{loadingPerms === false ? `Collaborate (${allPerms.otherUserPerms ? allPerms.otherUserPerms.size : 0})` : 'Collaborate'}
						</span>
					</button>
					<button className='action_button'
						onClick={() => setShowAttempts(true)}
						disabled={updatedInst.is_deleted}>
							<span>Extra Attempts</span>
					</button>
					<button className='action_button delete'
						onClick={() => updatedInst.is_deleted ? onUndelete(updatedInst.id) : onDelete(updatedInst.id)}>
						<span>{updatedInst.is_deleted ? 'Undelete' : 'Delete'}</span>
					</button>

				</div>
				</div>
				<div className='overview'>
					{errorText != '' ? <div className='error'><p>{errorText}</p></div> : <></> }
					{successText != '' ? <div className='success'><p>{successText}</p></div> : <></> }
					<div>
						<label>ID:</label>
						{updatedInst.id}
					</div>
					<div>
						<label>Owner:</label>
						{loadingInstOwner || instOwner == undefined ? 'Loading...' : `${instOwner[updatedInst.user_id]?.first_name ?? ''} ${instOwner[updatedInst.user_id]?.last_name ?? 'System Widget (No Owner)'}`}
					</div>
					<div>
						<label>Date Created:</label>
						{new Date(updatedInst.created_at).toLocaleString()}
					</div>
					<div>
						<label>Draft:</label>
						{updatedInst.is_draft ? 'Yes' : 'No'}
					</div>
					<div>
						<label>Student Made:</label>
						{updatedInst.is_student_made ? 'Yes' : 'No'}
					</div>
					<div>
						<label htmlFor="guest-access">Guest Access:</label>
						<select value={updatedInst.guest_access}
							id="guest-access"
							onChange={event => handleChange('guest_access', stringToBoolean(event.target.value))}>
							<option value={false}>No</option>
							<option value={true}>Yes</option>
						</select>
					</div>
					<div>
						<label>Student Access:</label>
						{updatedInst.student_access ? 'Yes' : 'No'}
					</div>
					<div>
						<label htmlFor="embedded-only">Embedded Only:</label>
						<select value={updatedInst.embedded_only}
							id="embedded-only"
							onChange={event => handleChange('embedded_only', stringToBoolean(event.target.value))}>
							<option value={false}>No</option>
							<option value={true}>Yes</option>
						</select>
					</div>
					<div>
						<label>Embedded:</label>
						{updatedInst.is_embedded ? 'Yes' : 'No'}
					</div>
					<div>
						<label>Deleted:</label>
						{updatedInst.is_deleted ? 'Yes' : 'No'}
					</div>
					<div>
						<label htmlFor="attempts">Attempts Allowed:</label>
						<select value={updatedInst.attempts}
							id="attempts"
							onChange={event => handleChange('attempts', event.target.value)}>
							<option value={-1}>Unlimited</option>
							<option value={1}>1</option>
							<option value={2}>2</option>
							<option value={3}>3</option>
							<option value={4}>4</option>
							<option value={5}>5</option>
							<option value={10}>10</option>
							<option value={15}>15</option>
							<option value={20}>20</option>
						</select>
					</div>
					<div>
						<label>Available:</label>
						<div className='radio'>
							<input type='radio'
								name='available'
								id="open-at-available"
								value={updatedInst.open_at ?? 'never'}
								checked={availableDisabled == false}
								onChange={() => setAvailableDisabled(false)}
							/>
							<label htmlFor="open-at-available">On</label>
							<input type='date' role="date"
								value={availableDate !== -1 ? availableDate : ''}
								onChange={event => setAvailableDate(event.target.value)}
								disabled={availableDisabled}
							/>
							<input type='time' role="time"
								value={availableTime !== -1 ? availableTime : ''}
								onChange={event => setAvailableTime(event.target.value)}
								disabled={availableDisabled}
							/>
						</div>
						<div className='radio'>
							<input type='radio'
								id="now"
								name='available'
								value={-1}
								checked={availableDisabled}
								onChange={() => {setAvailableDisabled(true); handleChange('open_at', -1)}}
							/>
							<label htmlFor="now">Now</label>
						</div>
					</div>
					<div>
						<label>Closes:</label>
						<div className='radio'>
							<input type='radio'
								name='closes'
								id="close-at"
								value={updatedInst.close_at ?? 'never'}
								checked={closeDisabled == false}
								onChange={() => setCloseDisabled(false)}
							/>
							<label htmlFor="close-at">On</label>
							<input type='date' role="date"
								value={closeDate !== -1 ? closeDate : ''}
								onChange={event => setCloseDate(event.target.value)} disabled={closeDisabled}
							/>
							<input type='time' role="time"
								value={closeTime !== -1 ? closeTime : ''}
								onChange={event => setCloseTime(event.target.value)} disabled={closeDisabled}
							/>
						</div>
						<div className='radio'>
							<input type='radio'
								name='closes'
								id="never"
								value={-1}
								checked={closeDisabled}
								onChange={() => {setCloseDisabled(true); handleChange('close_at', -1)}}
							/>
							<label htmlFor="never">Never</label>
						</div>
					</div>
					<div>
						<label>Embed URL:</label>
						<a className='url'
							href={updatedInst.embed_url}>
							{updatedInst.embed_url}
						</a>
					</div>
					<div>
						<label>Play URL:</label>
						<a className='url'
							href={updatedInst.play_url}>
							{updatedInst.play_url}
						</a>
					</div>
					<div>
						<label>Preview URL:</label>
						<a className='url'
							href={updatedInst.preview_url}>
							{updatedInst.preview_url}
						</a>
					</div>
					<div className='bottom-buttons'>
						<button className='action_button' onClick={() => setShowScoreDetails(!showScoreDetails)}>Scores</button>
						<div className='apply-changes'>
							<button className='action_button apply'
								onClick={applyChanges}>
								<span>Apply Changes</span>
							</button>
						</div>
					</div>

				</div>
				{ copyDialogRender }
				{ collaborateDialogRender }
				{ extraAttemptsDialogRender }
				<section>
					{ scoresContainer }
				</section>
			</section>
		</>
	)
}

export default SupportSelectedInstance
