import React, { useState, useEffect } from 'react'
import { iconUrl } from '../util/icon-url'
import fetchOptions from '../util/fetch-options'
import MyWidgetsCopyDialog from './my-widgets-copy-dialog'

const deleteInstance = (instId) => fetch('/api/json/widget_instance_delete', fetchOptions({body: 'data=' + encodeURIComponent(`["${instId}"]`)}))
const undeleteInstance = (instId) => fetch('/api/json/widget_instance_undelete', fetchOptions({body: 'data=' + encodeURIComponent(`["${instId}"]`)}))

const objToDateString = (time) => {
	if(time < 0) return time
	const timeObj = new Date(time * 1000)
	const year = String(timeObj.getFullYear())
	return year + "-" + addZero(timeObj.getMonth() + 1) + "-" + addZero(timeObj.getDate())
}

const addZero = i => {
	if(i<10) i = "0" + i
	return i
}

const objToTimeString = (time) => {
	if(time < 0) return time
	const timeObj = new Date(time * 1000)
	return addZero(timeObj.getHours()) + ":" + addZero(timeObj.getMinutes())
}

const stringToBoolean = s => {
	return s == 'true'
}



const SupportSelectedInstance = ({inst, onReturn, onCopy}) => {
	const [updatedInst, setUpdatedInst] = useState({...inst})
	const [showCopy, setShowCopy] = useState(false)

	useEffect(() => {
		console.log(updatedInst)
	})

	const handleChange = () => {

	}

	const makeCopy = (title, copyPerms) => {
		setShowCopy(false)
		onCopy(updatedInst.id, title, copyPerms)
		
	}

	const onDelete = (instId) => {
		console.log("calling delete")
		deleteInstance(instId)
		.then(resp => {
			if (resp.status == 200){
				setUpdatedInst({...updatedInst, is_deleted: true})
			}
			else {
				console.log("did not successfully delete")
			}
		})
	}

	const onUndelete = (instId) => {
		console.log("calling undelete")
		undeleteInstance(instId)
		.then(resp => {
			if (resp.status == 200){
				setUpdatedInst({...updatedInst, is_deleted: false})
			}
			else {
				console.log("did not successfully undelete")
			}
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
				<h1>{updatedInst.name}</h1>
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
				<button className="action_button">
					<span>Collaborate ({1})</span>
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
					<select value={updatedInst.guest_access} onChange={(event) => {setUpdatedInst({...updatedInst, guest_access: stringToBoolean(event.target.value)})}}>
						<option value={false}>No</option>
						<option value={true}>Yes</option>
					</select>
				</span>
				<span>
					<label>Student Access:</label>
					<select value={updatedInst.student_access} onChange={(event) => {setUpdatedInst({...updatedInst, student_access: stringToBoolean(event.target.value)})}}>
						<option value={false}>No</option>
						<option value={true}>Yes</option>
					</select>
				</span>
				<span>
					<label>Embedded Only:</label>
					<select value={updatedInst.embedded_only} onChange={handleChange}>
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
					<select value={updatedInst.attempts} onChange={handleChange}>
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
						<input type="radio" name="available" value="" checked={updatedInst.open_at > 0} onChange={handleChange}/>
						On
						<input type="date" value={objToDateString(updatedInst.open_at)} onChange={handleChange}/>
					</div>
					<div className="radio">
						<input type="radio" name="available" value={-1} checked={updatedInst.open_at < 0} onChange={handleChange}/>
						Now 
					</div>
				</span>
				<span>
					<label>Closes:</label>
					<div className="radio">
						<input type="radio" name="closes" value="" checked={updatedInst.close_at > 0}/>
						On
						<input type="date" />
					</div>
					<div className="radio">
						<input type="radio" name="closes" value={-1} checked={updatedInst.close_at < 0}/>
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
			</div>
			{showCopy 
				? <MyWidgetsCopyDialog onClose={() => setShowCopy(false)} onCopy={makeCopy}/>
				: null
			}
		</section>
	)
}

export default SupportSelectedInstance