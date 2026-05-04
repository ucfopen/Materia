import React, { useState } from 'react'
import Modal from './modal'
import './my-widgets-warning-dialog.scss'

const MyWidgetsPullDialog = ({onClose, onConfirm}) => {
	const [error, setError] = useState('')

	const handleConfirm = () => {
		onConfirm({
			onError: () => setError('This library entry is no longer available.')
		})
	}

	return (
		<Modal onClose={onClose}>
			<div className='warning-modal'>
				<span className='title'>
					Pull Latest from Community Library
				</span>
				<div className='content'>
					{error
						? <p className='error'>{error}</p>
						: <p>This will overwrite your widget's name and questions with the latest version from the Community Library. This cannot be undone.</p>
					}
				</div>
				<span className='buttons'>
					<a className='cancel_button'
						onClick={onClose}>
						{error ? 'Close' : 'Cancel'}
					</a>
					{!error && (
						<a className='action_button red'
							onClick={handleConfirm}>
							Pull Latest
						</a>
					)}
				</span>
			</div>
		</Modal>
	)
}

export default MyWidgetsPullDialog
