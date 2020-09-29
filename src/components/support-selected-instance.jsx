import React, { useState, useEffect } from 'react'
import { iconUrl } from '../util/icon-url'

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

const SupportSelectedInstance = ({inst, onReturn}) => {
	const [updatedInst, setUpdatedInst] = useState(inst)

	useEffect(() => {
		console.log(updatedInst)
	})

	const handleChange = () => {

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
				<img src={iconUrl('http://localhost/widget/', inst.widget.dir, 60)}/>
				<h1>{inst.name}</h1>
			</div>
			<div className="overview">
				<span>
					<label>ID:</label>{inst.id}
				</span>
				<span>
					<label>Date Created:</label>{(new Date(inst.created_at*1000)).toLocaleString()}
				</span>
				<span>
					<label>Draft:</label>{inst.is_draft ? 'Yes' : 'No'}
				</span>
				<span>
					<label>Student Made:</label>{inst.is_student_made ? 'Yes' : 'No'}
				</span>
				<span>
					<label>Guest Access:</label>
					<select value={inst.guest_access} onChange={(event) => {setUpdatedInst({...updatedInst, guest_access: stringToBoolean(event.target.value)})}}>
						<option value={false}>No</option>
						<option value={true}>Yes</option>
					</select>
				</span>
				<span>
					<label>Student Access:</label>
					<select value={inst.student_access} onChange={handleChange}>
						<option value={false}>No</option>
						<option value={true}>Yes</option>
					</select>
				</span>
				<span>
					<label>Embedded Only:</label>
					<select value={inst.embedded_only} onChange={handleChange}>
						<option value={false}>No</option>
						<option value={true}>Yes</option>
					</select>
				</span>
				<span>
					<label>Embedded:</label>{inst.is_embedded ? 'Yes' : 'No'}
				</span>
				<span>
					<label>Deleted:</label>
					<select value={inst.is_deleted} onChange={handleChange}>
						<option value={false}>No</option>
						<option value={true}>Yes</option>
					</select>
				</span>
				<span>
					<label>Attempts Allowed:</label>
					<select value={inst.attempts} onChange={handleChange}>
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
						<input type="radio" name="available" value="" checked={inst.open_at > 0} onChange={handleChange}/>
						On
						<input type="date" value={objToDateString(inst.open_at)} onChange={handleChange}/>
					</div>
					<div className="radio">
						<input type="radio" name="available" value={-1} checked={inst.open_at < 0} onChange={handleChange}/>
						Now 
					</div>
				</span>
				<span>
					<label>Closes:</label>
					<div className="radio">
						<input type="radio" name="closes" value="" checked={inst.close_at > 0}/>
						On
						<input type="date" />
					</div>
					<div className="radio">
						<input type="radio" name="closes" value={-1} checked={inst.close_at < 0}/>
						Never
					</div>
				</span>
				<span>
					<label>Embed URL:</label>
					<a className="url" href={inst.embed_url}>{inst.embed_url}</a>
				</span>
				<span>
					<label>Play URL:</label>
					<a className="url" href={inst.play_url}>{inst.play_url}</a>
				</span>
				<span>
					<label>Preview URL:</label>
					<a className="url" href={inst.preview_url}>{inst.preview_url}</a>
				</span>
			</div>
		</section>
	)
}

export default SupportSelectedInstance