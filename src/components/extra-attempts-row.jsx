import React, { useState } from 'react'
import './extra-attempts-dialog.scss'

// Component for each individual row in the Extra Attempts Gui
const ExtraAttemptsRow = ({extraAttempt, user, onChange}) => {
	// holds updated state of each extra attempts object/row
	// to send to parent if changed
	// sets row to display:none if removed, until parent render updates
	const [state, setState] = useState({...extraAttempt, disabled: false})

	const onRemove = () => {
		onChange(extraAttempt.id, {...state, extra_attempts: -1})
		setState({...state, extra_attempts: -1, disabled: true})
	}

	const onContextChange = e => {
		onChange(extraAttempt.id, {...state, context_id: e.target.value})
		setState({...state, context_id: e.target.value })
	}

	const onAttemptsChange = e => {
		if (e.target.value) {
			onChange(extraAttempt.id, {...state, extra_attempts: parseInt(e.target.value)})
			setState({...state, extra_attempts: parseInt(e.target.value)})
		}
	}

	return (
		<div className={`extra_attempt ${state.disabled ? 'disabled' : ''}`}>
			<div className="user_holder">
				<button tabIndex="0"
					onClick={onRemove}
					className="remove">
					X
				</button>
				<div className='user'>
					<img className="avatar" src={user.avatar} />

					<span className='user_name'>
						{`${user.first} ${user.last}`}
					</span>
				</div>
			</div>

			<div className='context'>
				<input 
					type="text"
					value={state.context_id}
					onChange={onContextChange} 
					required />
			</div>

			<div className='num_attempts'>
				<input 
					type="number"
					min="1"
					max="99"
					value={state.extra_attempts}
					onChange={onAttemptsChange}
					required />
			</div>
		</div>
	)
}

export default ExtraAttemptsRow
