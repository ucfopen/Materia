import React from 'react'
import KeyboardIcon from './keyboard-icon'
import ScreenReaderIcon from './screen-reader-icon'

const AccessibilityIndicator = ({widget = {}}) => {

	const accessLevelToText = (level) => {
		switch(level?.toLowerCase()) {
			case 'full':
				return 'fully'
			case 'limited':
				return 'partially'
			default:
				return 'not'
		}
	}

	let descriptionRender = ''
	if (widget.accessibility.keyboard.toLowerCase() != 'unavailable' || widget.accessibility.screen_reader.toLowerCase() != 'unavailable') {
		descriptionRender = widget.accessibility.description
	}
	else {
		descriptionRender = 'No accessibility information is provided for this widget.'
	}

	return (
		<div className='feature-list accessibility-options'>
			<div className='list-holder'>
				<span className='feature-heading'>Accessibility:</span>
				<ul>
					<li className={`accessibility-indicator ${widget.accessibility?.keyboard.toLowerCase() != 'unavailable' ? 'show' : ''}`}>
						<div className='icon-spacer'>
							<KeyboardIcon color='#5a5a5a'/>
						</div>
						<span>Keyboard is&nbsp;
							<span id='keyboard-access-level' className={`highlighted ${widget.accessibility?.keyboard.toLowerCase()}`}>
								{`${accessLevelToText(widget.accessibility?.keyboard)} supported`}
							</span>
						</span>
					</li>
					<li className={`accessibility-indicator ${widget.accessibility?.screen_reader.toLowerCase() != 'unavailable' ? 'show' : ''}`}>
						<div className='icon-spacer'>
							<ScreenReaderIcon color='#5a5a5a'/>
						</div>
						<span>Screen readers are&nbsp;
							<span id='screen-reader-access-level' className={`highlighted ${widget.accessibility?.screen_reader.toLowerCase()}`}>
								{`${accessLevelToText(widget.accessibility?.screen_reader)} supported`}
							</span>
						</span>
					</li>
					<li className={`accessibility-description ${descriptionRender.length > 0 ? 'show' : ''}`}>
						{descriptionRender}
					</li>
				</ul>
			</div>
		</div>
	)
}

export default AccessibilityIndicator
