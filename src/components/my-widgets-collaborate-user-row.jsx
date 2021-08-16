import React, { useEffect, useState, useRef } from 'react'
import { Portal } from 'react-overlays'
import { access } from './materia-constants'
import DatePicker from 'react-datepicker'
import './my-widgets-collaborate-dialog.scss'

const accessLevels = {
	[access.VISIBLE]: { value: access.VISIBLE, text: 'View Scores' },
	[access.FULL]: { value: access.FULL, text: 'Full' }
}

const initRowState = () => {
	return({
		remove: false,
		showDemoteDialog: false
	})
}

const dateToStr = (date) => {
	if (!date) return ''
	const monthString = `${date.getMonth() + 1}`.padStart(2, '0')
	const dayString = `${date.getDate()}`.padStart(2, '0')
	return `${date.getFullYear()}-${monthString}-${dayString}`
}

// convert time in ms to a displayable format for the component
const timestampToDisplayDate = (timestamp) => {
	if(!timestamp) return (new Date())
	return new Date(timestamp*1000);
}

// Portal so date picker doesn't have to worry about overflow
const CalendarContainer = ({children}) => {
	const el = document.getElementById('calendar-portal')

	return (
		<Portal container={el}>
			{children}
		</Portal>
	)
}

const CollaborateUserRow = ({user, perms, isCurrentUser, onChange, readOnly}) => {
	const [state, setState] = useState({...initRowState(), ...perms, expireDate: timestampToDisplayDate(perms.expireTime)})
	const ref = useRef()

	// updates parent everytime local state changes
	useEffect(() => {
		onChange(user.id, {
			accessLevel: state.accessLevel,
			expireTime: state.expireTime,
			editable: state.editable,
			shareable: state.shareable,
			can: state.can,
			remove: state.remove
		})
	}, [state])

	const checkForWarning = () => {
		if(isCurrentUser) {
			setState({...state, showDemoteDialog: true})
		}
		else removeAccess()
	}

	const cancelSelfDemote = () => setState({...state, showDemoteDialog: false})

	const removeAccess = () => setState({...state, remove: true, showDemoteDialog: false})

	const toggleShowExpire = () => {
		if (!isCurrentUser)
			setState({...state, showExpire: !state.showExpire})
	}

	const clearExpire = () => setState({...state, showExpire: false, expireDate: timestampToDisplayDate(), expireTime: null})

	const changeLevel = e => setState({...state, accessLevel: e.target.value})

	const onExpireChange = date => {
		const timestamp = date.getTime()/1000
		setState({...state, expireDate: date, expireTime: timestamp})
	}

	let selfDemoteWarningRender = null
	if (state.showDemoteDialog) {
		selfDemoteWarningRender = (
			<div className='demote-dialog'>
				<div className='arrow'></div>
				<div className='warning'>
					Are you sure you want to limit <strong>your</strong> access?
				</div>
				<a data-testid={`cancel-remove-access`} className='no-button' onClick={cancelSelfDemote}>No</a>
				<a data-testid={`accept-remove-access`} className='button action_button yes-button' onClick={removeAccess}>Yes</a>
			</div>
		)
	}

	const selectOptionElements = Object.values(accessLevels).map(level => (
		<option data-testid={`${user.id}-${level.value}`}
			key={level.value}
			value={level.value}>
			{level.text}
		</option>
	))

	let expirationSettingRender = null

	if (state.showExpire) {
		expirationSettingRender = (
			<span ref={ref} className='expire-date-container'>
				<DatePicker selected={state.expireDate}
					onChange={onExpireChange}
					popperContainer={CalendarContainer}
					placeholderText='Date'/>
				<span className='remove' onClick={clearExpire}>Set to Never</span>
				<span className='date-finish' onClick={toggleShowExpire}>Done</span>
			</span>
		)
	} else {
		if (state.expireTime !== null) {
			expirationSettingRender = (
				<button className={readOnly || isCurrentUser ? 'expire-open-button-disabled' : 'expire-open-button'}
					data-testid={`${user.id}-expire`}
					onClick={toggleShowExpire}
					disabled={readOnly}>
					{dateToStr(state.expireDate)}
				</button>
			)
		} else {
			expirationSettingRender = (
				<button className={readOnly || isCurrentUser ? 'expire-open-button-disabled' : 'expire-open-button'}
					data-testid={`${user.id}-never-expire`}
					onClick={toggleShowExpire}
					disabled={readOnly || isCurrentUser}>
					Never
				</button>
			)
		}
	}

	return (
		<div className={`user-perm ${state.remove ? 'deleted' : ''}`}>
			<button tabIndex='0'
				onClick={checkForWarning}
				className='remove'
				disabled={readOnly && !isCurrentUser}
				aria-hidden={readOnly && !isCurrentUser}
				data-testid={`${user.id}-delete-user`}>
				X
			</button>

			<div className='about'>
				<img className='avatar' src={user.avatar} />

				<span className={`name ${user.is_student ? 'user-match-student' : ''}`}>
					{`${user.first} ${user.last}`}
				</span>
			</div>
			{ selfDemoteWarningRender }
			<div className='options'>
				<select disabled={readOnly}
					data-testid={`${user.id}-select`}
					tabIndex='0'
					className='perm'
					value={state.accessLevel}
					onChange={changeLevel}>
					{ selectOptionElements }
				</select>
				<div className='expires'>
					<span className='expire-label'>Expires: </span>
					{ expirationSettingRender }
				</div>
			</div>
		</div>
	)
}

export default CollaborateUserRow
