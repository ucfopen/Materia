import React from 'react'
import KeyboardIcon from './keyboard-icon'
import ScreenReaderIcon from './screen-reader-icon'

const AccessibilityIndicator = ({widget = {}}) => {

	const access_level_to_text = (level) => {
		switch(level?.toLowerCase()) {
			case "full":
				return "fully"
			case "limited":
				return "partially"
			default:
				return "not"
		}
	}

	return (
		<div className="feature-list accessibility-options">
			<div className="list-holder">
				<span className="feature-heading">Accessibility:</span>
				<ul>
					<li>
						<div className="icon-spacer"><KeyboardIcon color='#5a5a5a'/></div>
						<span>Keyboard is&nbsp;
							<span id="keyboard-access-level" className={`highlighted ${widget.accessibility?.keyboard.toLowerCase()}`}>
								{`${access_level_to_text(widget.accessibility?.keyboard)} supported`}
							</span>
						</span>
					</li>
					<li>
						<div className="icon-spacer"><ScreenReaderIcon color='#5a5a5a'/></div>
						<span>Screen reader is&nbsp;
							<span id="screen-reader-access-level" className={`highlighted ${widget.accessibility?.screen_reader.toLowerCase()}`}>
								{`${access_level_to_text(widget.accessibility?.screen_reader)} supported`}
							</span>
						</span>
					</li>
				</ul>
			</div>
		</div>
	)
}

export default AccessibilityIndicator
