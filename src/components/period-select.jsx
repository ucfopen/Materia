import React, { useRef } from 'react'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import "./my-widgets-settings-dialog.scss"

const PeriodSelect = ({availInfo, index, formData, setFormData}) => {
	const amRef = useRef(null)
	const pmRef = useRef(null)

	// Selects am when the time input's focus is lost
	const blurTime = () => {
		if (!pmRef.current.classList.contains("selected") && !amRef.current.classList.contains("selected")) {
			amRef.current.classList.add("selected")
		}
	}

	const availChange = (index, val) => {
		let newRadios = [...formData.changes.radios]
		newRadios[index] = val
		setFormData({...formData, changes: {...formData.changes, radios: newRadios}})
	}

	const dateChange = (date, index) => {
		let newDates = [...formData.changes.dates]
		let newRadios = [...formData.changes.radios]

		newRadios[index] = false
		newDates[index] = date

		setFormData({...formData, changes: {...formData.changes, dates: newDates, radios: newRadios}})
	}

	const timeChange = (index, event) => {
		let newTimes = [...formData.changes.times]
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

	const periodChange = (index, period) => {
		let newPeriods = [...formData.changes.periods]

		// Turns on the radio if it wasn't already
		availChange(index, false)

		newPeriods[index] = period
		setFormData({...formData, changes: {...formData.changes, periods: newPeriods}})
		if (period === "am") {
			amRef.current.classList.add("selected")
			pmRef.current.classList.remove("selected")
		}
		else if (period === "pm") {
			pmRef.current.classList.add("selected")
			amRef.current.classList.remove("selected")
		}
	}

	return (
		<li className="from-picker" key={index}>
			<h3>{availInfo.header}</h3>
			<ul className="date-picker">
				<li>
					<input type="radio"
						value={"anytime"}
						checked={formData.changes.radios[index]}
						onChange={() => {availChange(index, true)}}/>
					<label>{availInfo.anytimeLabel}</label>
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
						onBlur={() => {blurTime()}}
						onClick={() => {availChange(index, false)}}
						value={(formData.changes.times[index])}
						onChange={(e) => {timeChange(index, e)}}/>
					<span className={`am ${availInfo.period === 'am' ? 'selected' : ''}`}
						ref={amRef}
						onClick={() => {periodChange(index, "am")}}>
						am
					</span>
					<span className={`pm ${availInfo.period === 'pm' ? 'selected' : ''}`}
						ref={pmRef}
						onClick={() => {periodChange(index, "pm")}}>
						pm
					</span>
				</li>
			</ul>
		</li>
	)
}

export default PeriodSelect
