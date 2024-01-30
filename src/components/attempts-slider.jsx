import React, { useEffect, useState } from 'react'
import './my-widgets-settings-dialog.scss'

const AttemptsSlider = ({inst, is_student, parentState, setParentState, currentAttemptsVal}) => {

	const [rawSliderVal, setRawSliderVal] = useState(parseInt(parentState.sliderVal))
	const [sliderStopped, setSliderStopped] = useState(false)

	// slider is moved
	const sliderChange = e => {
		if (parentState.formData.changes.access === 'guest') return
		setRawSliderVal(parseFloat(e.target.value))
	}

	// slider is released (mouse up or blur event)
	const sliderStop = e => {
		setSliderStopped(true)
	}

	// now that the slider value isn't actively changing, round the raw value to the nearest stop
	// pass that rounded value up to the parent component
	useEffect(() => {
		if (sliderStopped && parentState.formData.changes.access != 'guest') {
			const sliderInfo = getSliderInfo(rawSliderVal)
			// students cannot change attempts to anything other than
			// the original number of attempts or unlimited
			if (is_student && sliderInfo.val != currentAttemptsVal && sliderInfo.val != '100') {
				setSliderStopped(false)
				setRawSliderVal(parseInt(parentState.sliderVal))
				return
			}
			setParentState({...parentState, sliderVal: sliderInfo.val, lastActive: sliderInfo.last})
			setSliderStopped(false)
		}
	},[sliderStopped])

	// when the rounded value is updated in parent's state, update the raw slider value to match
	// this also synchronizes the slider with the rounded value when the number is clicked instead of interacting with the slider itself
	useEffect(() => {
		if (parseInt(parentState.sliderVal) !== rawSliderVal) {
			setRawSliderVal(parseInt(parentState.sliderVal))
		}
	}, [parentState.sliderVal])

	// takes a raw value and returns the rounded value to match the closest stop
	// note the values here represent the position on the slider that corresponds with a stop and not the actual attempt count
	const getSliderInfo = val => {
		switch(true){
			case val === -1:
				return {val: '100', last: 8}
			case val <= 3:
				return {val: '1', last: 0}
			case val <= 7:
				return {val: '5', last: 1}
			case val <= 11:
				return {val: '9', last: 2}
			case val <= 15:
				return {val: '13', last: 3}
			case val <= 27.5:
				return {val: '17', last: 4}
			case val <= 48:
				return {val: '39', last: 5}
			case val <= 68:
				return {val: '59', last: 6}
			case val <= 89:
				return {val: '79', last: 7}
			default:
				return {val: '100', last: 8}
		}
	}

	// Used when the number is clicked on the slider
	const updateSliderNum = (val, index) => {
		// Attempts always unlimited when guest access is true
		if (parentState.formData.changes.access === 'guest') return
		if (is_student && val != currentAttemptsVal && val != '100') return

		setParentState({...parentState, sliderVal: val.toString(), lastActive: index})
	}

	const generateStopSpan = (stopId, sliderPosition, display) => {
		const stopClickHandler = () => updateSliderNum(sliderPosition, stopId)
		return (
			<span key={stopId}
				className={`${parentState.lastActive === stopId ? 'active' : ''}`}
				onClick={stopClickHandler}>
				{display}
			</span>
		)
	}
	const selectChange = e => {
		if (parentState.formData.changes.access === 'guest') return
		let sliderInfo = getSliderInfo(parseInt(e.target.value))
		setParentState({...parentState, sliderVal: sliderInfo.val, lastActive: sliderInfo.last})
	}

	let guestModeRender = null
	if (parentState.formData.changes.access === 'guest') {
		guestModeRender = (
			<div className='desc-notice'>
				<b>Attempts are unlimited when Guest Mode is enabled.</b>
			</div>
		)
	}

	return (
		<div className='data-holder'>
			<div className ={`mobile selector ${parentState.formData.changes.access === 'guest' ? 'disabled' : ''}`}>
				<select onChange={selectChange}  value={parentState.sliderVal}>
					<option value='1'>1</option>
					<option value='5'>2</option>
					<option value='9'>3</option>
					<option value='13'>4</option>
					<option value='17'>5</option>
					<option value='39'>10</option>
					<option value='59'>15</option>
					<option value='79'>20</option>
					<option value='100'>Unlimited</option>
				</select>
			</div>
			<div className={`selector ${parentState.formData.changes.access === 'guest' ? 'disabled' : ''}`}>
				<input id='ui-slider'
					aria-label='attempts-input'
					className={`${parentState.formData.changes.access === 'guest' ? 'disabled' : ''}`}
					type='range'
					min='1'
					max='100'
					disabled={parentState.formData.changes.access === 'guest'}
					value={rawSliderVal}
					onMouseUp={sliderStop}
					onChange={sliderChange}
					onBlur={sliderStop}
				></input>
			</div>
			<div id='attempt-holder'
				aria-label='attempts-choices-container'
				className={`attempt-holder ${parentState.formData.changes.access === 'guest' ? 'disabled' : ''}`}>
				{ generateStopSpan(0, 1, '1') }
				{ generateStopSpan(1, 5, '2') }
				{ generateStopSpan(2, 9, '3') }
				{ generateStopSpan(3, 13, '4') }
				{ generateStopSpan(4, 17, '5') }
				{ generateStopSpan(5, 39, '10') }
				{ generateStopSpan(6, 59, '15') }
				{ generateStopSpan(7, 79, '20') }
				{ generateStopSpan(8, 100, 'Unlimited') }
			</div>
			<div className={`data-explanation ${inst.is_embedded ? 'embedded' : ''}`}>
				<div className='input-desc'>
					Attempts are the number of times a student can complete a widget.
					Only their highest score counts.
					{ guestModeRender }
				</div>
			</div>
		</div>
	)
}

export default AttemptsSlider
