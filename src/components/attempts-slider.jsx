import React from 'react'
import './my-widgets-settings-dialog.scss'

const AttemptsSlider = ({inst, state, setState}) => {

	const sliderChange = e => {
		if (state.formData.changes.access === 'guest') return

		setState({...state, sliderVal: e.target.value})
	}

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
		if (state.formData.changes.access === 'guest') return

		setState({...state, sliderVal: val.toString(), lastActive: index})
	}

	// Rounds the input to the nearest specified value when the slider knob is released
	const roundInput = (e) => {
		if (state.formData.changes.access === 'guest') return

		const val = parseFloat(e.target.value)

		const sliderInfo = getSliderInfo(val)
		setState({...state, sliderVal: sliderInfo.val, lastActive: sliderInfo.last})

		e.stopPropagation()
		e.preventDefault()
	}

	const generateStopSpan = (stopId, sliderPosition, display) => {
		const spanClass = state.lastActive === stopId ? 'active' : ''
		const stopClickHandler = () => updateSliderNum(sliderPosition, stopId)
		return (
			<span key={stopId}
				className={spanClass}
				onClick={stopClickHandler}>
				{display}
			</span>
		)
	}

	let guestModeRender = null
	if (state.formData.changes.access === 'guest') {
		guestModeRender = (
			<div className='desc-notice'>
				<b>Attempts are unlimited when Guest Mode is enabled.</b>
			</div>
		)
	}

	return (
		<div className='data-holder'>
			<div className={`selector ${state.formData.changes.access === 'guest' ? 'disabled' : ''}`}>
				<input id='ui-slider'
					aria-label='attempts-input'
					className={`${state.formData.changes.access === 'guest' ? 'disabled' : ''}`}
					type='range'
					min='1'
					max='100'
					disabled={state.formData.changes.access === 'guest'}
					value={state.sliderVal}
					onMouseUp={roundInput}
					onChange={sliderChange}
					onBlur={roundInput}
				></input>
			</div>
			<div id='attempt-holder'
				aria-label='attempts-choices-container'
				className={`attempt-holder ${state.formData.changes.access === 'guest' ? 'disabled' : ''}`}>
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
