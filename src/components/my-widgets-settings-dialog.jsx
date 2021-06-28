import React, { useState, useEffect, useRef } from 'react'
import { useQuery } from 'react-query'
import { apiGetUsers } from '../util/api'
import useUpdateWidget from './hooks/useUpdateWidget'
import Modal from './modal'
import PeriodSelect from './period-select'
import AttemptsSlider from './attempts-slider'
import "./my-widgets-settings-dialog.scss"

const initState = () => {
	return({
		sliderVal: "100",
		errorLabel: "",
		lastActive: 8,
		showWarning: false,
		availability: [{}, {}],
		formData: {
			data: {}, 
			changes: {
				radios: [true, true],
				dates: [new Date(), new Date()],
				times: ["",""],
				periods: ["",""],
				access: ""
			},
			errors: {
				date: [false, false],
				time: [false, false]
			}
		}
	})
}

const valueToAttempts = (val) => {
	switch(true){
		case val <= 3:
			return 1
		case val <= 7:
			return 2
		case val <= 11:
			return 3
		case val <= 15:
			return 4
		case val <= 27.5:
			return 5
		case val <= 48:
			return 10
		case val <= 68:
			return 15
		case val <= 89:
			return 20
		default:
			return -1
	}
}

const attemptsToValue = (attempts) => {
	switch(attempts){
		case 1:
			return 1
		case 2:
			return 5
		case 3:
			return 9
		case 4:
			return 13
		case 5:
			return 17
		case 10:
			return 39
		case 15:
			return 59
		case 20:
			return 79
		default:
			return 100
	}
}

const attemptsToIndex = (attempts) => {
	switch(attempts){
		case 1:
			return 0
		case 2:
			return 1
		case 3:
			return 2
		case 4:
			return 3
		case 5:
			return 4
		case 10:
			return 5
		case 15:
			return 6
		case 20:
			return 7
		default:
			return 8
	}
}

const MyWidgetsSettingsDialog = ({ onClose, inst, currentUser, otherUserPerms }) => {
	const [state, setState] = useState(initState())
	const mounted = useRef(false)
	const mutateWidget = useUpdateWidget()
	const { data: fetchedUsers } = useQuery({
		queryKey: ['user-search', inst.id],
		queryFn: () => apiGetUsers(Array.from(otherUserPerms.keys())),
		placeholderData: {},
		enabled: !!otherUserPerms && Array.from(otherUserPerms.keys())?.length > 0,
		staleTime: Infinity
	})

	// Used for initialization
	useEffect(() => {
		mounted.current = true
		const open = inst.open_at
		const close = inst.close_at
		const dates = [
			open > -1 ? new Date(open * 1000) : null,
			close > -1 ? new Date(close * 1000) : null,
		]
		let _availability = []
		let access = inst.guest_access === true ? "guest" : "normal"
		access = inst.embedded_only === true ? "embed" : access

		// Gets the initila date, time, & period data
		dates.forEach((date, i) => {
			let data = {
				header: i === 0 ? "Available" : "Closes",
				anytimeLabel: i === 0 ? "Now" : "Never"
			}

			if (date) {
				const ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date)
				const mo = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(date)
				const da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(date)
				const min = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes()
				let hr = date.getHours() > 12 ? date.getHours() - 12 : date.getHours()
				if (hr === 0) hr = 12

				data.date = `${mo}/${da}/${ye}`
				data.time = `${hr}:${min}`
				data.period = date.getHours() >= 12 ? 'pm' : 'am'
				data.anytime = false
			} else {
				data.date = ''
				data.time = ''
				data.period = ''
				data.anytime = true
			}

			_availability.push(data)
		})

		// Gets the dates in a format the DatePicker can understand
		let dateOpen = new Date(_availability[0].date)
		let dateClosed = new Date(_availability[1].date)
		dateOpen = isNaN(dateOpen) ? "" : dateOpen
		dateClosed = isNaN(dateClosed) ? "" : dateClosed

		// Initializes the form data
		const _formData = {
			data: {
				inst_id: inst.id,
				open_at: inst.open_at,
				close_at: inst.close_at,
				attempts: inst.attempts,
				guest_access: inst.guest_access,
				embedded_only: inst.embedded_only
			},
			changes: {
				radios: [
					parseInt(inst.open_at) === -1 ? true : false,
					parseInt(inst.close_at) === -1 ? true : false
				],
				dates: [
					dateOpen,
					dateClosed
				],
				times: [
					_availability[0].time,
					_availability[1].time
				],
				periods: [
					_availability[0].period,
					_availability[1].period
				],
				access: access,
			},
			errors: {
				date: [false, false],
				time: [false, false]
			}
		}

		setState({...state,
			sliderVal: attemptsToValue(parseInt(inst.attempts)),
			lastActive: attemptsToIndex(parseInt(inst.attempts)),
			availability: _availability,
			formData: _formData
		})
		
		return () => (mounted.current = false)
	}, [])

	// Disables the slider if guest access is enabled
	useEffect(() => {
		if (state.formData.changes.access === "guest") {
			setState({...state,
				sliderVal: "100",
				lastActive: 8,
				formData: {...state.formData, data: {...state.formData.data, attempts: -1}}
			})
		}
	}, [inst.guest_access, JSON.stringify(state.formData)])

	const accessChange = (val) => {
		// Warns the user if doing this will remove students from collaboration
		let _showWarning = false

		if (val !== "guest" && inst.guest_access) {
			for (const key in fetchedUsers) {
				if (fetchedUsers.hasOwnProperty(key) && fetchedUsers[key].is_student) {
					_showWarning = true
					break
				}
			}
		}

		setState({...state, showWarning: _showWarning, formData: {...state.formData, changes: {...state.formData.changes, access: val}}})
	}

	const submitForm = () => {
		const changes = state.formData.changes
		const openClose = validateFormData(changes.dates, changes.times, changes.periods)
		const errInfo = getErrorInfo(openClose[2]) // Creates an error message if needed
		const errMsg = errInfo.msg
		const errors = errInfo.errors
		let form = {
			inst_id: inst.id,
			open_at: openClose[0],
			close_at: openClose[1],
			attempts: valueToAttempts(state.sliderVal),
			guest_access: false,
			embedded_only: false
		}

		if (state.formData.changes.access === "embed") {
			form.embedded_only = true
		}
		else if (state.formData.changes.access === "guest") {
			form.guest_access = true
			form.attempts = -1
		}

		// Submits the form if there are no errors
		if (errMsg.length === 0) {
			let args = [
				form.inst_id,
				undefined,
				null,
				null,
				form.open_at,
				form.close_at,
				form.attempts,
				form.guest_access,
				form.embedded_only,
			]

			mutateWidget.mutate({
				args: args,
				successFunc: () => {
					if (mounted.current) {
						onClose()
					}
				}
			})
		}
		else {
			setState({...state, errorLabel: errMsg, formData: {...state.formData, errors: errors}})
		}
	}

	// Returns an array of the two dates followed by the error list
	const validateFormData = (dates, times, periods) => {
		let newDates = []
		let errors = {
			dateErrors: [false, false], 
			timeErrors: [false, false], 
			startTimeError: false
		}

		// Gets the formatted new dates and validates them
		for (let index = 0; index < 2; index++) {
			const date = dates[index]
			const time = times[index]
			const period = periods[index]
			let dateError = false
			let timeError = false
			let newDate = new Date()

			// It is anytime
			if (state.formData.changes.radios[index] === true) {
				newDates.push(-1)
				continue
			}

			// Validates the time
			const reTime = /^\d{1,2}:\d\d$/
			const val = reTime.exec(time)
			
			// Regex wasn't matched
			if (val === null) {
				timeError = true
			}
			else {
				const hr = parseInt(val.splice(":")[0])
				const min = parseInt(val.splice(":")[0])

				// Invalid time
				if (hr <= 0 || hr > 12 || min < 0 || min > 59) {
					timeError = true
				}
			}

			if (date === "" || isNaN(Date.parse(date))) {
				dateError = true
			}
			else {
				let dateStr = (date.getMonth() + 1) + '/' + date.getDate() + "/" + date.getFullYear()
				newDate = Date.parse(dateStr + ' ' + time + ' ' + period) / 1000
			}

			errors.dateErrors[index] = dateError
			errors.timeErrors[index] = timeError
			newDates.push(newDate)
		}

		if (state.formData.changes.radios[1] !== true && dates[0] > dates[1]) {
			errors.startTimeError = true
		}

		newDates.push(errors)

		return newDates
	}

	const getErrorInfo = (formErrors) => {
		let errMsg = ""
		let dateErrCount = 0
		let timeErrCount = 0
		let numMissing = false
		let errors = {
			date: [false, false],
			time: [false, false]
		}

		dateErrCount += formErrors.dateErrors[0] === true ? 1 : 0
		dateErrCount += formErrors.dateErrors[1] === true ? 1 : 0
		timeErrCount += formErrors.timeErrors[0] === true ? 1 : 0
		timeErrCount += formErrors.timeErrors[1] === true ? 1 : 0
		
		// Sets the input error color
		errors.date[0] = formErrors.dateErrors[0]
		errors.date[1] = formErrors.dateErrors[1]
		errors.time[0] = formErrors.timeErrors[0]
		errors.time[1] = formErrors.timeErrors[1]

		// Gets if missing or invalid
		numMissing += state.formData.changes.dates[0].length === 0 ? 1 : 0
		numMissing += state.formData.changes.dates[1].length === 0 ? 1 : 0
		numMissing += state.formData.changes.times[0].length === 0 ? 1 : 0
		numMissing += state.formData.changes.times[1].length === 0 ? 1 : 0

		// Handles the many different cases of the error message
		if (dateErrCount !== 0 || timeErrCount !== 0) {
			errMsg = "The "

			switch(dateErrCount) {
				case 1:
					errMsg += "date "
					break
				case 2:
					errMsg += "dates "
					break
			}

			errMsg += dateErrCount !== 0 && timeErrCount !== 0 ? "and " : ""

			switch(timeErrCount) {
				case 1:
					errMsg += "time "
					break
				case 2:
					errMsg += "times "
					break
			}

			errMsg += (dateErrCount !== 0 && timeErrCount !== 0) || (dateErrCount > 1 || timeErrCount > 1) ?
			"are " :
			"is "

			if (numMissing >= timeErrCount + dateErrCount)
				errMsg += "missing."
			else if (numMissing !== 0)
				errMsg += "invalid/missing."
			else
				errMsg += "invalid."
		}
		else if (formErrors.startTimeError) {
			errMsg = "The widget cannot be closed before it becomes available."
		}

		return {msg: errMsg, errors: errors}
	}

	return (
		<Modal onClose={onClose} ignoreClose={state.showWarning}>
			<div className="settings-modal">
				<div className="top-bar">
					<span className="title">Settings</span>
					{state.errorLabel.length > 0
						? <p className='availability-error'>{state.errorLabel}</p>
						: null
					}
				</div>
				{currentUser.is_student
					? <p className="student-role-notice">You are viewing a limited version of this page due to your current role as a student. Students do not have permission to change certain settings like attempt limits or access levels.</p>
					: null
				}
				<ul className="attemptsPopup">
					<li className={`attempt-content ${currentUser.is_student ? 'hide' : ''}`}>
						<h3>Attempts</h3>
						<AttemptsSlider key="slider-key" inst={inst} state={state} setState={setState}/>
					</li>
					<ul className="to-from">
						{
							state.availability.map((val, index) => {
								return (
									<PeriodSelect key={index} availInfo={val} index={index} formData={state.formData} setFormData={(data) => {setState({...state, formData: data})}}/>
								)
							})
						}
						<li className="access">
							<h3>Access</h3>
							<ul className={`access-options ${inst.is_embedded ? "embedded" : ""}`}>
								<li className={`normal ${inst.is_student_made ? '' : 'show'}`}>
									<input type="radio"
										id="normal-radio"
										value="normal"
										checked={state.formData.changes.access === "normal"}
										onChange={() => {accessChange("normal")}} />
									<label>Normal</label>
									<div className="input-desc">
										Only students and users who can log into Materia can
										access this widget. If the widget collects scores, those
										scores will be associated with the user. The widget can
										be distributed via URL, embed code, or as an assignment
										in your LMS.
									</div>
								</li>
								<li className={`guest-mode ${inst.is_student_made ? 'disabled' : ''}`}>
									<input type="radio"
										id="guest-radio"
										value="guest"
										checked={state.formData.changes.access === "guest"}
										onChange={() => {accessChange("guest")}} />
									<label>Guest Mode</label>
									<div className="input-desc">
										Anyone with a link can play this widget without logging in.
										All recorded scores will be anonymous. Can't use in an
										external system.
										<div className="desc_notice"><b>Guest Mode is always on for widgets created by students.</b></div>
									</div>
								</li>
								<li
									id="embedded-only"
									className={`embed-only ${inst.is_embedded ? 'show' : ''}`}
								>
									<input type="radio"
										id="embed-radio"
										value="embed"
										checked={state.formData.changes.access === "embed"}
										onChange={() => {accessChange("embed")}}
									/>
									<label>Embedded Only</label>
									<div className="input-desc">
										This widget will not be playable outside of the classes
										it is embedded within.
									</div>
								</li>
							</ul>
						</li>
					</ul>
				</ul>
				<ul className="bottom-buttons">
					<li>
						<a className="cancel_button"
							onClick={onClose}>
							Cancel
						</a>
					</li>
					<li>
						<a className="action_button green save"
							onClick={submitForm}>
							Save
						</a>
					</li>
				</ul>
			</div>
			{ state.showWarning === true
				?
				<Modal onClose={() => {setState({...state, showWarning: false})}} smaller={true} alert={true}>
					<span className="alert-title">Students with access will be removed</span>
					<p className="alert-description">Warning: Disabling Guest Mode will automatically revoke access to this widget for any students it has been shared with!</p>
					<button className="alert-btn" onClick={() => {setState({...state, showWarning: false})}}>Okay</button>
				</Modal>
				:
				null
			}
		</Modal>
	)
}

export default MyWidgetsSettingsDialog
