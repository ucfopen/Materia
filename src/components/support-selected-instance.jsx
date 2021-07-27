import React, { useState, useEffect } from 'react'
import { apiGetUserPermsForInstance } from '../util/api'
import { useQuery } from 'react-query'
import { iconUrl } from '../util/icon-url'
import rawPermsToObj from '../util/raw-perms-to-object'
import useDeleteWidget from './hooks/useSupportDeleteWidget'
import useUnDeleteWidget from './hooks/useSupportUnDeleteWidget'
import useUpdateWidget from './hooks/useSupportUpdateWidget'
import MyWidgetsCopyDialog from './my-widgets-copy-dialog'
import MyWidgetsCollaborateDialog from './my-widgets-collaborate-dialog'
import ExtraAttemptsDialog from './extra-attempts-dialog'

const addZero = i => {
	if(i<10) i = "0" + i
	return i
}

const objToDateString = (time) => {
	if(time < 0) return time
	const timeObj = new Date(time * 1000)
	const year = String(timeObj.getFullYear())
	return year + "-" + addZero(timeObj.getMonth() + 1) + "-" + addZero(timeObj.getDate())
}

const objToTimeString = (time) => {
	if(time < 0) return time
	const timeObj = new Date(time * 1000)
	return addZero(timeObj.getHours()) + ":" + addZero(timeObj.getMinutes())
}

const stringToDateObj = (date, time) => {
	return Date.parse(date + 'T' + time) / 1000
}

const stringToBoolean = s => {
	return s === 'true'
}

const SupportSelectedInstance = ({inst, currentUser, onReturn, onCopy}) => {
	const [updatedInst, setUpdatedInst] = useState({...inst})
	const [showCopy, setShowCopy] = useState(false)
	const [showCollab, setShowCollab] = useState(false)
	const [showAttempts, setShowAttempts] = useState(false)
	const [availableDisabled, setAvailableDisabled] = useState(inst.open_at < 0)
	const [availableDate, setAvailableDate] = useState(inst.open_at < 0 ? '' : objToDateString(inst.open_at))
	const [availableTime, setAvailableTime] = useState(inst.open_at < 0 ? '' : objToTimeString(inst.open_at))
	const [closeDisabled, setCloseDisabled] = useState(inst.close_at < 0)
	const [closeDate, setCloseDate] = useState(inst.close_at < 0 ? '' : objToDateString(inst.close_at))
	const [closeTime, setCloseTime] = useState(inst.close_at < 0 ? '' : objToTimeString(inst.close_at))
	const [errorText, setErrorText] = useState('')
	const [allPerms, setAllPerms] = useState({myPerms: null, otherUserPerms: null})
	const deleteWidget = useDeleteWidget()
	const unDeleteWidget = useUnDeleteWidget()
	const updateWidget = useUpdateWidget()
	const { data: perms, isFetching: loadingPerms} = useQuery({
		queryKey: ['user-perms', inst.id],
		queryFn: () => apiGetUserPermsForInstance(inst.id),
		enabled: !!inst && inst.id !== undefined,
		placeholderData: null,
		staleTime: Infinity
	})

	useEffect(() => {
		if (perms) {
			console.log('perms updated')
			console.log(perms)
			const isEditable = inst.widget.is_editable === "1"
			const othersPerms = new Map()
			for(const i in perms.widget_user_perms){
				othersPerms.set(i, rawPermsToObj(perms.widget_user_perms[i], isEditable))
			}
			let _myPerms
			for(const i in perms.user_perms){
				_myPerms = rawPermsToObj(perms.user_perms[i], isEditable)
			}

			setAllPerms({myPerms: _myPerms, otherUserPerms: othersPerms})
		}
	}, [perms])

	const handleChange = (attr, value) => {
		setUpdatedInst({...updatedInst, [attr]: value })
	}

	const makeCopy = (title, copyPerms) => {
		setShowCopy(false)
		onCopy(updatedInst.id, title, copyPerms, updatedInst)
	}

	const onDelete = (instId) => {
		deleteWidget.mutate({
			instId: instId,
			successFunc: () => setUpdatedInst({...updatedInst, is_deleted: true})
		})
	}

	const onUndelete = (instId) => {
		unDeleteWidget.mutate({
			instId: instId,
			successFunc: () => setUpdatedInst({...updatedInst, is_deleted: false})
		})
	}

	const applyChanges = () => {
		setErrorText('')
		let u = updatedInst

		// set date and time from input boxes
		if(!availableDisabled) {
			if(availableDate == '' || availableTime == '') {
				setErrorText('Please enter valid dates and times')
				return
			}
			else {
				u.open_at = stringToDateObj(availableDate, availableTime)
			}
		}
		if(!closeDisabled){
			if(closeDate == '' || closeTime == '') {
				setErrorText('Please enter valid dates and times')
				return
			}
			else {
				u.close_at = stringToDateObj(closeDate, closeTime)
			}
		}

		//make sure title is not blank
		if(u.name == '' || u.name == null){
			setErrorText('Name cannot be blank')
			return
		}

		setUpdatedInst({...updatedInst, 
			'open_at': stringToDateObj(availableDate, availableTime),
			'close_at': stringToDateObj(closeDate, closeTime)
		})

		const args = [
			u.id,
			undefined,
			null,
			null,
			u.open_at,
			u.close_at,
			u.attempts,
			u.guest_access,
			u.embedded_only,
		]

		updateWidget.mutate({
			args: args,
			successFunc: () => setErrorText('Success!'),
			errorFunc: () => setErrorText('Error: Update Unsuccessful')
		})
	}

	return (
		<section className="page inst-info">
			<div>
				<button 
					className="action_button back" 
					onClick={() => {onReturn()}}
				>
					<span className="arrow"></span>
					<span className="goBackText">Return</span>
				</button>
			</div>
			<div className="header">
				<img src={iconUrl('http://localhost/widget/', updatedInst.widget.dir, 60)}/>
				<input type="text" value={updatedInst.name} onChange={(event) => handleChange('name', event.target.value)}/>
			</div>
			<div className="inst-action-buttons">
				<button 
					className="action_button"
					onClick={() => updatedInst.is_deleted ? onUndelete(updatedInst.id) : onDelete(updatedInst.id)}>
					<span>{updatedInst.is_deleted ? 'Undelete' : 'Delete'}</span>
				</button>
				<button 
					className="action_button"
					onClick={() => setShowCopy(true)}>
					<span>Make a Copy</span>
				</button>
				<button 
					className="action_button"
					onClick={() => setShowCollab(true)}
					disabled={updatedInst.is_deleted}>
					<span title={updatedInst.is_deleted ? 'cannot collab on deleted instance' : null}
						>{loadingPerms === false ? `Collaborate (${allPerms.otherUserPerms ? allPerms.otherUserPerms.size : 0})` : 'Collaborate'}
					</span>
				</button>
				<button 
					className="action_button"
					onClick={() => setShowAttempts(true)}
					disabled={updatedInst.is_deleted}>
						<span>Extra Attempts</span>
				</button>
				<button 
					className="action_button"
					onClick={() => {window.location = `http://localhost/widgets/${updatedInst.widget.dir}create#${updatedInst.id}`}}
				>
					<span>Edit Widget</span>
				</button>
			</div>
			<div className="overview">
				<span>
					<label>ID:</label>{updatedInst.id}
				</span>
				<span>
					<label>Date Created:</label>{(new Date(updatedInst.created_at*1000)).toLocaleString()}
				</span>
				<span>
					<label>Draft:</label>{updatedInst.is_draft ? 'Yes' : 'No'}
				</span>
				<span>
					<label>Student Made:</label>{updatedInst.is_student_made ? 'Yes' : 'No'}
				</span>
				<span>
					<label>Guest Access:</label>
					<select value={updatedInst.guest_access} onChange={(event) => handleChange('guest_access', stringToBoolean(event.target.value))}>
						<option value={false}>No</option>
						<option value={true}>Yes</option>
					</select>
				</span>
				<span>
					<label>Student Access:</label>{updatedInst.student_access ? 'Yes' : 'No'}
				</span>
				<span>
					<label>Embedded Only:</label>
					<select value={updatedInst.embedded_only} onChange={(event) => handleChange('embedded_only', stringToBoolean(event.target.value))}>
						<option value={false}>No</option>
						<option value={true}>Yes</option>
					</select>
				</span>
				<span>
					<label>Embedded:</label>{updatedInst.is_embedded ? 'Yes' : 'No'}
				</span>
				<span>
					<label>Deleted:</label>{updatedInst.is_deleted ? 'Yes' : 'No'}
				</span>
				<span>
					<label>Attempts Allowed:</label>
					<select value={updatedInst.attempts} onChange={(event) => handleChange('attempts', event.target.value)}>
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
				</span>
				<span>
					<label>Available:</label>
					<div className="radio">
						<input type="radio" name="available" value={updatedInst.open_at} checked={availableDisabled == false} onChange={() => setAvailableDisabled(false)}/>
						On
						<input type="date" value={availableDate !== -1 ? availableDate : ''} onChange={(event) => setAvailableDate(event.target.value)} disabled={availableDisabled}/>
						<input type="time" value={availableTime !== -1 ? availableTime : ''} onChange={(event) => setAvailableTime(event.target.value)} disabled={availableDisabled}/>
					</div>
					<div className="radio">
						<input type="radio" name="available" value={-1} checked={availableDisabled} onChange={() => {setAvailableDisabled(true); handleChange('open_at', -1)}}/>
						Now 
					</div>
				</span>
				<span>
					<label>Closes:</label>
					<div className="radio">
						<input type="radio" name="closes" value={updatedInst.close_at} checked={closeDisabled == false} onChange={() => setCloseDisabled(false)}/>
						On
						<input type="date" value={closeDate !== -1 ? closeDate : ''} onChange={event => setCloseDate(event.target.value)} disabled={closeDisabled}/>
						<input type="time" value={closeTime !== -1 ? closeTime : ''} onChange={event => setCloseTime(event.target.value)} disabled={closeDisabled}/>
					</div>
					<div className="radio">
						<input type="radio" name="closes" value={-1} checked={closeDisabled} onChange={() => {setCloseDisabled(true); handleChange('close_at', -1)}}/>
						Never
					</div>
				</span>
				<span>
					<label>Embed URL:</label>
					<a className="url" href={updatedInst.embed_url}>{updatedInst.embed_url}</a>
				</span>
				<span>
					<label>Play URL:</label>
					<a className="url" href={updatedInst.play_url}>{updatedInst.play_url}</a>
				</span>
				<span>
					<label>Preview URL:</label>
					<a className="url" href={updatedInst.preview_url}>{updatedInst.preview_url}</a>
				</span>
				<div className='right-justify'>
					<div className="apply-changes">
						<button 
						className="action_button apply"
						onClick={() => applyChanges()}
						>
							<span>Apply Changes</span>
						</button>
						<span className="error-text">{errorText}</span>
					</div>
				</div>
				
			</div>
			{showCopy 
				? <MyWidgetsCopyDialog onClose={() => setShowCopy(false)} name={updatedInst.name} onCopy={makeCopy}/>
				: null
			}

			{showCollab
				? <MyWidgetsCollaborateDialog 
						currentUser={currentUser} 
						inst={inst} 
						myPerms={allPerms.myPerms} 
						otherUserPerms={allPerms.otherUserPerms} 
						setOtherUserPerms={(p) => setAllPerms({...allPerms, otherUserPerms: p})} 
						onClose={() => {setShowCollab(false)}}
					/>
				: null
			}

			{showAttempts 
				? <ExtraAttemptsDialog 
						onClose={() => setShowAttempts(false)}
						inst={inst}
					/>
				: null
			}
		</section>
	)
}

export default SupportSelectedInstance
