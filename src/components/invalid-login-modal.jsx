import React from 'react'
import Modal from './modal'

const InvalidLoginModal = ({onClose}) => (
	<Modal onClose={onClose} ignoreClose={true} smaller={true} alert={true}>
		<div>
			<span className='alert-title'>
				Your Session is No Longer Valid
			</span>
			<p className='alert-description'>Your session with Materia is considered invalid and you have been logged out. You'll have to log back in to see this content.</p>
			<span className='buttons'>
				<a className='action_button'
					onClick={onClose}>
					Okay
				</a>
			</span>
		</div>
	</Modal>
)

export default InvalidLoginModal
