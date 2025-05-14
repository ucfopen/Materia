import React, { useState } from 'react'
import Modal from './modal'
import './my-widgets-copy-dialog.scss'
import useCopyWidget from './hooks/useCopyWidget'

const MyWidgetsCopyDialog = ({inst, name, onClose, onCopySuccess, onCopyError}) => {
	const [newTitle, setNewTitle] = useState(`${name} (Copy)`)
	const [copyPermissions, setCopyPermissions] = useState(false)
	const [errorText, setErrorText] = useState('')
	const copyWidget = useCopyWidget('me')

	const handleTitleChange = e => setNewTitle(e.target.value)
	const handleOwnerAccessChange = e => setCopyPermissions(e.target.checked)
	const handleCopyClick = () => onCopy(inst.id, newTitle, copyPermissions, inst)

	// an instance has been copied: the mutation will optimistically update the widget list while the list is re-fetched from the server
	const onCopy = (instId, newTitle, newPerm, inst) => {
		setErrorText('')

		copyWidget.mutate(
			{
				instId: instId,
				title: newTitle,
				copyPermissions: newPerm,
				widgetName: inst.widget.name,
				dir: inst.widget.dir,
				successFunc: newInst => {
					onCopySuccess(newInst)
				},
				errorFunc: (err) => {
					setErrorText(('Error' || err.message) + ': Copy Unsuccessful')
					if (onCopyError) onCopyError(err)
					else if (err.message == "Invalid Login") {
						window.location.href = '/users/login'
						return
					}
					else if (err.message == "Permission Denied") {
						setErrorText('Permission Denied')
					}
				}
			}
		)
	}

	let error = null
	if (errorText) {
		error = <div className='error'><p>{errorText}</p></div>
	}

	return (
		<Modal onClose={onClose}>
			<div className='copy-modal'>
				<span className='title'>Make a Copy</span>
				<div className=''>
					<div className='container'>
						{ error }
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
							<label className='checkbox-wrapper'>
								<input type='checkbox'
									checked={copyPermissions}
									onChange={handleOwnerAccessChange}
								/>
								<span className='custom-checkbox'></span>
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
