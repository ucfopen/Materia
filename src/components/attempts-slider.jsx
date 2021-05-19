import React from 'react'
import "./my-widgets-settings-dialog.scss"

const AttemptsSlider = ({inst, state, setState}) => {

	const sliderChange = (e) => {
		setState({...state, sliderVal: e.target.value})
	}

	const getSliderInfo = (val) => {
		let sliderInfo = {val: "100", last: 8}
		
		switch(true){
			case val === -1:
				sliderInfo = {val: "100", last: 8}
				break
			case val <= 3:
				sliderInfo = {val: "1", last: 0}
				break
			case val <= 7:
				sliderInfo = {val: "5", last: 1}
				break
			case val <= 11:
				sliderInfo = {val: "9", last: 2}
				break
			case val <= 15:
				sliderInfo = {val: "13", last: 3}
				break
			case val <= 27.5:
				sliderInfo = {val: "17", last: 4}
				break
			case val <= 48:
				sliderInfo = {val: "39", last: 5}
				break
			case val <= 68:
				sliderInfo = {val: "59", last: 6}
				break
			case val <= 89:
				sliderInfo = {val: "79", last: 7}
				break
			default:
				sliderInfo = {val: "100", last: 8}
				break
		}

		return sliderInfo
	}

	// Used when the number is clicked on the slider
	const updateSliderNum = (val, index) => {
		// Attempts always unlimited when guest access is true
		if (state.formData.changes.access === "guest") 
			return

		setState({...state, sliderVal: val.toString(), lastActive: index})
	}

	// Rounds the input to the nearest specified value when the slider knob is released
	const roundInput = (e) => {
		if (state.formData.changes.access === "guest") 
			return

		let val = parseFloat(e.target.value)

		const sliderInfo = getSliderInfo(val)
		setState({...state, sliderVal: sliderInfo.val, lastActive: sliderInfo.last})

		e.stopPropagation()
		e.preventDefault()
	}

	return (
		<div className="data-holder">
			<div className={`selector ${state.sliderDisabled || state.formData.changes.access === "guest" ? 'disabled' : ''}`}>
				<input id="ui-slider"
					className={`${state.sliderDisabled ? 'disabled' : ''}`}
					type="range"
					min="1"
					max="100"
					disabled={state.sliderDisabled}
					value={state.sliderVal}
					onMouseUp={roundInput}
					onChange={sliderChange}
					onBlur={roundInput}
				></input>
			</div>
			<div id='attempt-holder' className={`attempt-holder ${state.sliderDisabled || state.formData.changes.access === "guest" ? 'disabled' : ''}`}>
				<span className={`${state.lastActive === 0 ? 'active' : ''}`} onClick={() => { updateSliderNum(1, 0) }}>1</span>
				<span className={`${state.lastActive === 1 ? 'active' : ''}`} onClick={() => { updateSliderNum(5, 1) }}>2</span>
				<span className={`${state.lastActive === 2 ? 'active' : ''}`} onClick={() => { updateSliderNum(9, 2) }}>3</span>
				<span className={`${state.lastActive === 3 ? 'active' : ''}`} onClick={() => { updateSliderNum(13, 3) }}>4</span>
				<span className={`${state.lastActive === 4 ? 'active' : ''}`} onClick={() => { updateSliderNum(17, 4) }}>5</span>
				<span className={`${state.lastActive === 5 ? 'active' : ''}`} onClick={() => { updateSliderNum(39 , 5) }}>10</span>
				<span className={`${state.lastActive === 6 ? 'active' : ''}`} onClick={() => { updateSliderNum(59, 6) }}>15</span>
				<span className={`${state.lastActive === 7 ? 'active' : ''}`} onClick={() => { updateSliderNum(79, 7) }}>20</span>
				<span className={`${state.lastActive === 8 ? 'active' : ''}`} onClick={() => { updateSliderNum(100, 8) }}>Unlimited</span>
			</div>
			<div className={`data-explanation ${inst.is_embedded ? "embedded" : ""}`}>
				<div className="input-desc">
					Attempts are the number of times a student can complete a widget.
					Only their highest score counts.
					{ state.formData.changes.access === "guest"
						? 
						<div className="desc-notice">
							<b>Attempts are unlimited when Guest Mode is enabled.</b>
						</div>
						: null
					}
				</div>
			</div>
		</div>
	)
}

export default AttemptsSlider
