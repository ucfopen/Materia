import React, { useState } from 'react'
import Modal from './modal'
import './my-widgets-copy-dialog.scss'

const MyWidgetsCopyDialog = ({onClose, onCopy, name}) => {
	const [newTitle, setNewTitle] = useState(`${name} (Copy)`)
	const [copyPermissions, setCopyPermissions] = useState(false)

	const handleTitleChange = e => setNewTitle(e.target.value)
	const handleOwnerAccessChange = e => setCopyPermissions(e.target.checked)
	const handleCopyClick = () => onCopy(newTitle, copyPermissions)

	return (
		<Modal onClose={onClose}>
			<div className='copy-modal'>
				<span className='title'>Make a Copy</span>
				<div className=''>
					<div className='container'>
						<div className='title_container'>
							<label htmlFor='copy-title'>New Title:</label>
							<input id='copy-title'
								className='new-title'
								type='text'
								placeholder='New Widget Title'
								value={newTitle}
								onChange={handleTitleChange}
							/>
						</div>
						<div className='options_container'>
							<label>
								<input type='checkbox'
									checked={copyPermissions}
									onChange={handleOwnerAccessChange}
								/>
								Grant Access to Original Owner(s)
							</label>
							<p className='input_desc'>
								If checked, all users who have access to the original widget will continue to have access to the new copy.
								Note that the rules for sharing widgets with students will still apply.
							</p>
						</div>
						<div className='bottom_buttons'>
							<a className='cancel_button'
								onClick={onClose}>
								Cancel
							</a>
							<a className='action_button green copy_button'
								onClick={handleCopyClick}>
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
