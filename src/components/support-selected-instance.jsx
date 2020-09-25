import React, { useState, useEffect } from 'react'
import { iconUrl } from '../util/icon-url'

const SupportSelectedInstance = ({inst, onReturn}) => {
	const [openAt, setOpenAt] = useState(inst.open_at)

	const handleChange = (event) => {
		
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
					<select value={inst.guest_access} onChange={(event) => {inst.guest_access = event.target.value}}>
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
						<input type="radio" name="available" value="" onChange={handleChange}/>
						On
						<input type="date" value={} onChange={handleChange}/>
					</div>
					<div className="radio">
						<input type="radio" name="available" value={-1} onChange={handleChange}/>
						Now 
					</div>
				</span>
				<span>
					<label>Closes:</label>
					<div className="radio">
						<input type="radio" name="closes" value="" />
						On
						<input type="date" />
					</div>
					<div className="radio">
						<input type="radio" name="closes" value={-1} />
						Never
					</div>
				</span>
				<span>

				</span>
			</div>
		</section>
	)
}

export default SupportSelectedInstance