import React, { useState, useEffect } from 'react'
import Modal from './modal'

const MyWidgetsCopyDialog = ({onClose, onCopy, name}) => {
	const [newTitle, setNewTitle] = useState('')
	const [copyPermissions, setCopyPermissions] = useState(false)

	useEffect(() => {setNewTitle(name + " copy")}, [])

	return (
		<Modal onClose={onClose}>
			<div className="copy-modal">
				<span className="title">Make a Copy</span>

				<div className="">
					<div className="container">
						<div className="title_container">
							<label htmlFor="copy-title">New Title:</label>
							<input
									id="copy-title"
									className="new-title"
									type="text"
									placeholder="New Widget Title"
									value={newTitle}
									onChange={(e) => {setNewTitle(e.target.value)}}
								/>
						</div>
						<div className="options_container">
							<label>
								<input
									type="checkbox"
									checked={copyPermissions}
									onChange={(e) => {setCopyPermissions(e.target.checked)}}
								/>
								Grant Access to Original Owner(s)
							</label>
							<p className="input_desc">If checked, all users who have access to the original widget will continue to have access to the new copy. Note that the rules for sharing widgets with students will still apply.</p>
						</div>
						<div className="bottom_buttons">
							<a className="cancel_button" onClick={() => {onClose()}}>
								Cancel
							</a>
							<a className="action_button green copy_button" onClick={() => {onCopy(newTitle, copyPermissions)}}>
								Copy
							</a>
						</div>
					</div>
				</div>
			</div>
		</Modal>
	)
}

export default MyWidgetsCopyDialog
