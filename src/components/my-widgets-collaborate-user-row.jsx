import React, { useEffect, useState, useRef } from 'react'
import { Portal } from 'react-overlays'
import { access } from './materia-constants'
import useClickOutside from '../util/use-click-outside'
import DatePicker from "react-datepicker"
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
	if(!date) return ""
	return date.getFullYear() + '-' + ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '-' + ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate()))
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

	useClickOutside(ref, () => {
		setState({...state, showExpire: false})
	})

	const checkForWarning = () => {
		if(isCurrentUser) { 
			setState({...state, showDemoteDialog: true})
		}
		else removeAccess()
	}

	const removeAccess = () => {
			setState({...state, remove: true, showDemoteDialog: false})
	}

	const toggleShowExpire = (e) => {
		if (!isCurrentUser)
			setState({...state, showExpire: !state.showExpire})
	}

	const clearExpire = () => {
		setState({...state, showExpire: false, expireDate: timestampToDisplayDate(), expireTime: null})
	}

	const changeLevel = e => {
		setState({...state, accessLevel: e.target.value})
	}

	const onExpireChange = date => {
		const timestamp = date.getTime()/1000
		setState({...state, expireDate: date, expireTime: timestamp})
	}

	return (
		<div className={`user-perm ${state.remove ? "deleted" : ""}`}>
			<button tabIndex="0"
				onClick={checkForWarning}
				className="remove"
				disabled={readOnly && !isCurrentUser}>
				X
			</button>

			<div className="about">
				<img className="avatar" src={user.avatar} />

				<span className={`name ${user.is_student ? 'user-match-student' : ''}`}>
					{`${user.first} ${user.last}`}
				</span>
			</div>
			{ state.showDemoteDialog
				? <div className="demote-dialog">
						<div className="arrow"></div>
						<div className="warning">
							Are you sure you want to limit <strong>your</strong> access?
						</div>
						<a className="no-button" onClick={() => setState({...state, showDemoteDialog: false})}>No</a>
						<a className="button action_button yes-button" onClick={removeAccess}>Yes</a>
					</div>
				: null
			}
			<div className="options">
				<select
					disabled={readOnly}
					tabIndex="0"
					className="perm"
					value={state.accessLevel}
					onChange={changeLevel}
				>
					{Object.values(accessLevels).map(level =>  <option key={level.value} value={level.value}>{level.text}</option> )}
				</select>
				<div className="expires">
					<span className="expire-label">Expires: </span>
					{state.showExpire
						? <span ref={ref} className="expire-date-container">
							<DatePicker
								selected={state.expireDate}
								onChange={onExpireChange}
								popperContainer={CalendarContainer}
							placeholderText="Date"/>
							<span className="remove" onClick={clearExpire}>Set to Never</span>
							<span className="date-finish" onClick={(e) => {toggleShowExpire(e)}}>Done</span>
							</span>
						: 
							state.expireTime !== null
							? <button className={readOnly || isCurrentUser ? 'expire-open-button-disabled' : 'expire-open-button'} onClick={(e) => {toggleShowExpire(e)}} disabled={readOnly}>{dateToStr(state.expireDate)}</button>
							: <button className={readOnly || isCurrentUser ? 'expire-open-button-disabled' : 'expire-open-button'} onClick={(e) => {toggleShowExpire(e)}} disabled={readOnly}>Never</button>
					}
				</div>
			</div>
		</div>
	)
}

export default CollaborateUserRow
