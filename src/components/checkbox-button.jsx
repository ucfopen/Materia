import React, { useEffect, useState } from 'react';
import './checkbox-button.scss';

const CheckboxButton = ({ labelOn, labelOff, onChange, reset, customStyle }) => {
	const [isChecked, setIsChecked] = useState(false);
	const [isFocused, setIsFocused] = useState(false);

	useEffect(() => {
		if (reset) {
			setIsChecked(false);
			onChange(false); //to tell our x button to reset
		}
	}, [reset, onChange]);


	const handleDivClick = () => {
		const newCheckedState = !isChecked;
		setIsChecked(newCheckedState);
		onChange(newCheckedState);
	};

	const handleKeyPress = (event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleDivClick();
		}
	};

	const handleFocus = (event) => {
		setIsFocused(true);
		const parentDiv = event.target.closest('.CheckboxButton');
		if (parentDiv) {
			parentDiv.classList.add('focused');
		}
	};

	const handleBlur = (event) => {
		setIsFocused(false);
		const parentDiv = event.target.closest('.CheckboxButton');
		if(parentDiv) {
			parentDiv.classList.remove('focused');
		}
	};

	return (
	<div
		className={`CheckboxButton ${isChecked ? 'on' : 'off'}`}
		onClick={handleDivClick}
		onKeyDown={handleKeyPress}
		onFocus={handleFocus}
		onBlur={handleBlur}
		style={customStyle}

	>
	<label>{isChecked ? labelOn : labelOff}</label>
		<input
			type="checkbox"
			checked={isChecked}
			onChange={() => {}}
			tabIndex="0"
		/>
	</div>
  );
};

export default CheckboxButton;

