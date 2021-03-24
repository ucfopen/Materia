import React from 'react'
import Modal from './modal'
import './my-widgets-warning-dialog.scss'

const MyWidgetsWarningDialog = ({onClose, onEdit}) => {

	return (
		<Modal onClose={onClose}>
			<div className="warning-modal">
				<span className="title">Warning About Editing Published Widgets:</span>
				<div className="content">
					<p>Editing a published widget may affect statistical analysis when comparing data collected prior to your edits.</p>
					<h3>Caution should be taken when:</h3>
					<ul>
						<li>Students have already completed your widget</li>
						<li>You make significant content changes</li>
						<li>Edits change the difficulty level</li>
						<li>Statistics will be used for research</li>
					</ul>
				</div>
				<span className="buttons">
					<a className="cancel_button"
						onClick={onClose}>
						Cancel
					</a>
					<a className="action_button green"
						onClick={onEdit}>
						Edit Published Widget
					</a>
				</span>

			</div>
		</Modal>
	)
}

export default MyWidgetsWarningDialog
