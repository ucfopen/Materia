import React, { useState, useEffect } from 'react'
import Modal from './modal'
import fetchOptions from '../util/fetch-options'
import DatePicker from "react-datepicker"
import "./my-widgets-settings-dialog.scss"
import "react-datepicker/dist/react-datepicker.css"

const fetchUpdateWidget = (args) => fetch('/api/json/widget_instance_update', fetchOptions({body: `data=${encodeURIComponent(JSON.stringify(args))}`}))
const fetchUsers = (arrayOfUserIds) => fetch('/api/json/user_get', fetchOptions({body: `data=${encodeURIComponent(JSON.stringify([arrayOfUserIds]))}`}))

const initForm = {
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

const MyWidgetsSettingsDialog = ({ onClose, inst, currentUser, otherUserPerms, updateWidget }) => {
	const [errorLabel, setErrorLabel] = useState("")
	const [sliderVal, setSliderVal] = useState("100")
	const [lastActive, setLastActive] = useState(0)
	const [availability, setAvailability] = useState([{}, {}])
	const [submitData, setSubmitData] = useState({form: {}, error: "", submit: false})
	const [showWarning, setShowWarning] = useState(false)
	const [collabUsers, setCollabUsers] = useState({})
	const [formData, setFormData] = useState(initForm)

	// Used for initialization
	useEffect(() => {
		const open = inst.open_at
		const close = inst.close_at
		const dates = [
			open > -1 ? new Date(open * 1000) : null,
			close > -1 ? new Date(close * 1000) : null,
		]
		const attempts = parseInt(inst.attempts)
		let elems = document.getElementsByClassName("slider-val")
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

		setAvailability(_availability)

		// Initializes the form data
		setFormData({
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
					inst.open_at === "-1" ? true : false,
					inst.close_at === "-1" ? true : false
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
		})

		//Initializes the slider
		setSlider(attempts)
	}, [])

	// Gets the collab users needed for form validation
	useEffect(() => {
		const userIdsToLoad = Array.from(otherUserPerms.keys())
		fetchUsers(userIdsToLoad)
		.then(res => res.json())
		.then(_users => {
			const keyedUsers = {}
			if (Array.isArray(_users)) {
				_users.forEach(u => { keyedUsers[u.id] = u})
				setCollabUsers(keyedUsers)
			}
		})
	}, [inst])

	// Handles settings form submission
	useEffect(() => {
		if (submitData.submit && submitData.error.length === 0) {
			let args = [
				submitData.form.inst_id,
				undefined,
				null,
				null,
				submitData.form.open_at,
				submitData.form.close_at,
				submitData.form.attempts,
				submitData.form.guest_access,
				submitData.form.embedded_only,
			]

			fetchUpdateWidget(args)
			.then(res => res.json())
			.then(widgetInfo => {
				if (widgetInfo.msg !== "error")
					onClose()
					
				updateWidget(widgetInfo)
			})
			.catch(error => {
				//console.log(error)
			})
		}
		else if (submitData.submit) {
			setSubmitData({...submitData, submit: false})
		}
	}, [submitData])

	// Disables the slider if guest access is enabled
	useEffect(() => {
		if (inst.guest_access) {
			document.getElementById("ui-slider").disabled = true
			document.getElementById("ui-slider").classList.add("disabled")
			setLastActive(-1)
		}
	}, [inst.guest_access])

	const setSlider = (val) => {
		let elems = document.getElementsByClassName("slider-val")

		switch(true){
			case (val === -1):
				setSliderVal("100")
				setLastActive(8)
				elems[8].classList.add("active")
				break
			case (val <= 3):
				setSliderVal("1")
				setLastActive(0)
				elems[0].classList.add("active")
				break
			case (val <= 7):
				setSliderVal("5")
				setLastActive(1)
				elems[1].classList.add("active")
				break
			case (val <= 11):
				setSliderVal("9")
				setLastActive(2)
				elems[2].classList.add("active")
				break
			case (val <= 15):
				setSliderVal("13")
				setLastActive(3)
				elems[3].classList.add("active")
				break
			case (val <= 27.5):
				setSliderVal("17")
				setLastActive(4)
				elems[4].classList.add("active")
				break
			case (val <= 48):
				setSliderVal("39")
				setLastActive(5)
				elems[5].classList.add("active")
				break
			case (val <= 68):
				setSliderVal("59")
				setLastActive(6)
				elems[6].classList.add("active")
				break
			case (val <= 89):
				setSliderVal("79")
				setLastActive(7)
				elems[7].classList.add("active")
				break
			default:
				setSliderVal("100")
				setLastActive(8)
				elems[8].classList.add("active")
				break
		}
	}

	const sliderChange = (e) => {
		setSliderVal(document.getElementById("ui-slider").value)
	}

	// Used when the number is clicked on the slider
	const updateSliderNum = (val, index) => {
		// Attempts always unlimited when guest access is true
		if (inst.guest_access) 
			return

		const sliderVals = document.getElementsByClassName("slider-val")

		if (lastActive !== -1 && sliderVals.length > lastActive) {
			sliderVals[lastActive].classList.remove("active")
		}

		setSliderVal(val.toString())
		setLastActive(index)
		sliderVals[index].classList.add("active")
	}

	// Rounds the input to the nearest specified value when the slider knob is released
	const roundInput = (e) => {
		if (inst.guest_access) 
			return

		let val = parseFloat(document.getElementById("ui-slider").value)
		let elems = document.getElementsByClassName("slider-val")
		
		if (lastActive !== -1 && elems.length > lastActive) {
			elems[lastActive].classList.remove("active")
		}

		setSlider(val)

		e.stopPropagation()
		e.preventDefault()
	}

	const availChange = (index, val) => {
		let newRadios = formData.changes.radios

		newRadios[index] = val
		setFormData({...formData, changes: {...formData.changes, radios: newRadios}})
	}

	const dateChange = (date, index) => {
		let newDates = formData.changes.dates

		// Sets the availability to "On"
		availChange(index, false)
		
		newDates[index] = date
		setFormData({...formData, changes: {...formData.changes, dates: newDates}})
	}

	const timeChange = (index, event) => {
		let newTimes = formData.changes.times
		let val = event.currentTarget.value

		// Prevents anything other than numbers and the : symbol to be entered
		if (val.length > 0) {
			let char = val.charAt(val.length - 1)
			if ((char < "0" || char > "9") && char !== ":") {
				val = val.slice(0, -1)
			}
		}

		newTimes[index] = val
		setFormData({...formData, changes: {...formData.changes, times: newTimes}})
	}

	// Selects am when the time input's focus is lost
	const blurTime = (index) => {
		let amClass = document.getElementsByClassName("am")[index]
		let pmClass = document.getElementsByClassName("pm")[index]

		if (!pmClass.classList.contains("selected") && !amClass.classList.contains("selected")) {
			amClass.classList.add("selected")
		}
	}

	const periodChange = (index, period) => {
		let newPeriods = formData.changes.periods
		let amClass = document.getElementsByClassName("am")[index]
		let pmClass = document.getElementsByClassName("pm")[index]

		// Turns on the radio if it wasn't already
		availChange(index, false)

		newPeriods[index] = period
		if (period === "am") {
			amClass.classList.add("selected")
			pmClass.classList.remove("selected")
		}
		else if (period === "pm") {
			pmClass.classList.add("selected")
			amClass.classList.remove("selected")
		}
	}

	const accessChange = (val) => {
		// Warns the user if doing this will remove students from collaboration
		if (val !== "guest" && inst.guest_access) {
			for (let key in collabUsers) {
				if (collabUsers.hasOwnProperty(key) && collabUsers[key].is_student) {
					setShowWarning(true)
					break
				}
			}
		}

		setFormData({...formData, changes: {...formData.changes, access: val}})
	}

	const submitForm = () => {
		const changes = formData.changes
		const openClose = validateFormData(changes.dates, changes.times, changes.periods)
		let errMsg = ""
		let form = {
			inst_id: inst.id,
			open_at: openClose[0],
			close_at: openClose[1],
			attempts: -1,
			guest_access: false,
			embedded_only: false
		}

		// Creates an error message if needed
		errMsg = getErrorMsg(openClose[2])

		form.attempts = getFormAttempts()

		if (formData.changes.access === "embed") {
			form.embedded_only = true
		}
		else if (formData.changes.access === "guest") {
			form.guest_access = true
			form.attempts = -1
		}

		setSubmitData({form: form, error: errMsg, submit: true})
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
			let date = dates[index]
			let time = times[index]
			let period = periods[index]
			let dateError = false
			let timeError = false
			let newDate = new Date()

			// It is anytime
			if (formData.changes.radios[index] === true) {
				newDates.push(-1)
				continue
			}

			// Validates the time
			let reTime = /^\d{1,2}:\d\d$/
			let val = reTime.exec(time)
			
			// Regex wasn't matched
			if (val === null) {
				timeError = true
			}
			else {
				let hr = parseInt(val.splice(":")[0])
				let min = parseInt(val.splice(":")[0])

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

		if (formData.changes.radios[1] !== true && dates[0] > dates[1]) {
			errors.startTimeError = true
		}

		newDates.push(errors)

		return newDates
	}

	const getErrorMsg = (formErrors) => {
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
		numMissing += formData.changes.dates[0].length === 0 ? 1 : 0
		numMissing += formData.changes.dates[1].length === 0 ? 1 : 0
		numMissing += formData.changes.times[0].length === 0 ? 1 : 0
		numMissing += formData.changes.times[1].length === 0 ? 1 : 0

		setFormData({...formData, errors: errors})

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

		setErrorLabel(errMsg)

		return errMsg
	}

	const getFormAttempts = () => {
		const val = parseFloat(document.getElementById("ui-slider").value)

		switch(true){
			case (val <= 3):
				return 1
			case (val <= 7):
				return 2
			case (val <= 11):
				return 3
			case (val <= 15):
				return 4
			case (val <= 27.5):
				return 5
			case (val <= 48):
				return 10
			case (val <= 68):
				return 15
			case (val <= 89):
				return 20
			default:
				return -1
		}
	}

	return (
		<Modal onClose={onClose} ignoreClose={showWarning}>
			<div className="settings-modal">
				<div className="top-bar">
					<span className="title">Settings</span>
					{errorLabel.length > 0
						? <p className='availability-error'>{errorLabel}</p>
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
						<div className="data-holder">
							<div className={`selector ${inst.guest_access === true ? 'disabled' : ''}`}>
								<input id="ui-slider"
									type="range"
									min="1"
									max="100"
									value={sliderVal}
									onMouseUp={roundInput}
									onChange={sliderChange}
									onBlur={roundInput}
								></input>
							</div>
							<div className={`attempt-holder ${inst.guest_access === true ? 'disabled' : ''}`}>
								<span className="slider-val" onClick={() => { updateSliderNum(1, 0) }}>1</span>
								<span className="slider-val" onClick={() => { updateSliderNum(5, 1) }}>2</span>
								<span className="slider-val" onClick={() => { updateSliderNum(9, 2) }}>3</span>
								<span className="slider-val" onClick={() => { updateSliderNum(13, 3) }}>4</span>
								<span className="slider-val" onClick={() => { updateSliderNum(17, 4) }}>5</span>
								<span className="slider-val" onClick={() => { updateSliderNum(39 , 5) }}>10</span>
								<span className="slider-val" onClick={() => { updateSliderNum(59, 6) }}>15</span>
								<span className="slider-val" onClick={() => { updateSliderNum(79, 7) }}>20</span>
								<span className="slider-val" onClick={() => { updateSliderNum(100, 8) }}>Unlimited</span>
							</div>
							<div className={`data-explanation ${inst.is_embedded ? "embedded" : ""}`}>
								<div className="input-desc">
									Attempts are the number of times a student can complete a widget.
									Only their highest score counts.
									{ inst.guest_access
										? 
										<div className="desc-notice">
											<b>Attempts are unlimited when Guest Mode is enabled.</b>
										</div>
										: null
									}
								</div>
							</div>
						</div>
					</li>
					<ul className="to-from">
						{
							availability.map((val, index) => {
								return (
									<li className="from-picker" key={index}>
										<h3>{val.header}</h3>
										<ul className="date-picker">
											<li>
												<input type="radio"
													value={"anytime"}
													checked={formData.changes.radios[index]}
													onChange={() => {availChange(index, true)}}/>
												<label>{val.anytimeLabel}</label>
											</li>
											<li className="date-list-elem">
												<input type="radio"
													value={"specify"}
													checked={!formData.changes.radios[index]}
													onChange={() => {availChange(index, false)}}/>
												<label>On</label>
												<DatePicker
													selected={formData.changes.dates[index]} 
													className={`date ${formData.errors.date[index] ? 'error' : ''}`}
													onChange={date => dateChange(date, index)}
													placeholderText="Date"/>
												at
												<input type="text"
													className={`time ${formData.errors.time[index] ? 'error' : ''}`}
													placeholder="Time"
													onBlur={() => {blurTime(index)}}
													onClick={() => {availChange(index, false)}}
													value={(formData.changes.times[index])}
													onChange={(e) => {timeChange(index, e)}}/>
												<span className={`am ${val.period === 'am' ? 'selected' : ''}`}
													onClick={() => {periodChange(index, "am")}}>
													am
												</span>
												<span className={`pm ${val.period === 'pm' ? 'selected' : ''}`}
													onClick={() => {periodChange(index, "pm")}}>
													pm
												</span>
											</li>
										</ul>
									</li>
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
										checked={formData.changes.access === "normal"}
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
										checked={formData.changes.access === "guest"}
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
										checked={formData.changes.access === "embed"}
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
			{ showWarning === true
				?
				<Modal onClose={() => {setShowWarning(false)}} smaller={true} alert={true}>
					<span className="alert-title">Students with access will be removed</span>
					<p className="alert-description">Warning: Disabling Guest Mode will automatically revoke access to this widget for any students it has been shared with!</p>
					<button className="alert-btn" onClick={() => {setShowWarning(false)}}>Okay</button>
				</Modal>
				:
				null
			}
		</Modal>
	)
}

export default MyWidgetsSettingsDialog
