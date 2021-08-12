import React, { useRef } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import './my-widgets-settings-dialog.scss'

const PeriodSelect = ({availInfo, index, formData, setFormData}) => {
	const amRef = useRef(null)
	const pmRef = useRef(null)

	// Selects am when the time input's focus is lost
	const blurTime = index => {
		// If the current value is not in the 'x:xx' or 'xx:xx' format, rewrite it
		let time = formData.changes.times[index]
		const reTime = /^\d{1,2}:\d\d$/
		let timeMatch = reTime.exec(time)
		if (!timeMatch) {
			time = `${formData.changes.times[index]}`.padEnd(3, 0)
			time = `${time.substr(0,time.length-2)}:${time.substr(-2)}`
		}

		const timeHour = parseInt(time.substr(0,time.length-2), 10)
		// If the hour value is higher than 12, subtract 12 and select PM
		if (timeHour > 12) autoChangeTime(`${timeHour - 12}:${time.substr(-2)}`, 'pm')
		// If the hour value is lower than 0, add 12 and select AM
		else if (timeHour < 1) autoChangeTime(`${timeHour + 12}:${time.substr(-2)}`, 'am')
		// Assume whatever is currently selected between AM/PM is good enough
		else autoChangeTime(time)

		if (!pmRef.current.classList.contains('selected') && !amRef.current.classList.contains('selected')) {
			amRef.current.classList.add('selected')
		}
	}
	// When the 'time' value is automatically rewritten from the logic above, change it with this.
	const autoChangeTime = (time, period = null) => {
		const newTimes = [...formData.changes.times]
		newTimes[index] = time
		if (period) {
			let newPeriods = [...formData.changes.periods]
			newPeriods[index] = period
			setFormData({...formData, changes: {...formData.changes, times: newTimes, periods: newPeriods}})
			setPeriodClasses(period)
		} else {
			setFormData({...formData, changes: {...formData.changes, times: newTimes}})
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
			if ((char < '0' || char > '9') && char !== ':') {
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
		setPeriodClasses(period)
	}

	const setPeriodClasses = period => {
		if (period === 'am') {
			amRef.current.classList.add('selected')
			pmRef.current.classList.remove('selected')
		}
		else if (period === 'pm') {
			pmRef.current.classList.add('selected')
			amRef.current.classList.remove('selected')
		}
	}

	return (
		<li className='from-picker' key={index}>
			<h3>{availInfo.header}</h3>
			<ul className='date-picker'>
				<li>
					<input type='radio'
						aria-label={`anytime-input-${index}`}
						value={'anytime'}
						checked={formData.changes.radios[index]}
						onChange={() => {availChange(index, true)}}/>
					<label>{availInfo.anytimeLabel}</label>
				</li>
				<li className='date-list-elem'>
					<input type='radio'
						aria-label={`on-input-${index}`}
						value={'specify'}
						checked={!formData.changes.radios[index]}
						onChange={() => {availChange(index, false)}}/>
					<label>On</label>
					<DatePicker
						selected={formData.changes.dates[index]}
						className={`date ${formData.errors.date[index] ? 'error' : ''}`}
						onChange={date => dateChange(date, index)}
						placeholderText='Date'/>
					at
					<input type='text'
						aria-label={`time-input-${index}`}
						className={`time ${formData.errors.time[index] ? 'error' : ''}`}
						placeholder='Time'
						onBlur={() => {blurTime(index)}}
						onClick={() => {availChange(index, false)}}
						value={(formData.changes.times[index])}
						onChange={(e) => {timeChange(index, e)}}/>
					<span className={`am ${availInfo.period === 'am' ? 'selected' : ''}`}
						aria-label={`am-input-${index}`}
						ref={amRef}
						onClick={() => {periodChange(index, 'am')}}>
						am
					</span>
					<span className={`pm ${availInfo.period === 'pm' ? 'selected' : ''}`}
						aria-label={`pm-input-${index}`}
						ref={pmRef}
						onClick={() => {periodChange(index, 'pm')}}>
						pm
					</span>
				</li>
			</ul>
		</li>
	)
}

export default PeriodSelect
