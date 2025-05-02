import React, { useState } from 'react'
import { iconUrl } from '../util/icon-url'
import SupportSelectedInstance from './support-selected-instance'

const UserAdminInstanceAvailable = ({instance, index, onCopySuccess, currentUser}) => {
	const [error, setError] = useState('')

	const [instanceState, setInstanceState] = useState({
		expanded: false,
		manager: false
	})

	let managerRender = null
	if (instanceState.manager) {
		managerRender = (
			<SupportSelectedInstance inst={instance}
				key={instance ? instance.id : ''}
				currentUser={currentUser}
				onCopySuccess={onCopySuccess}
				embed={true}
			/>
		)
	}

	let errorRender = null
	if (error) {
		errorRender = <div className='error'><p>{error}</p></div>
	}

	return (
		<li key={index} className={`instance ${instanceState.expanded ? 'expanded' : ''}`}>
			<div className={`clickable widget-title ${instanceState.manager ? 'hidden' : ''}`}
		onClick={() => setInstanceState(instanceState => ({...instanceState, expanded: !instanceState.expanded, manager: false}))}>
				<span className='img-holder'>
					<img src={iconUrl('/widget/', instance.widget.dir, 275)} />
				</span>
				<span className='title-holder'>
					<div className='title'>
						{ instance.name }
					</div>
					<div>
						{ instance.widget.name }
					</div>
				</span>
			</div>
			{ !instanceState.manager ?
				<div className={`info-holder`}>
					<div>
						<span>
							<label>ID:</label> { instance.id }
						</span>
					</div>
					<div>
						<span>
							<label>Created:</label> { `${new Date(instance.created_at).toLocaleDateString()}` }
						</span>
					</div>
					<div>
						<span>
							<label>Publish status:</label> { instance.is_draft ? 'Draft' : 'Published' }
						</span>
					</div>
					<div>
						<span>
							<label>Student-Made:</label> { instance.is_student_made ? 'Yes' : 'No' }
						</span>
					</div>
					<div>
						<span>
							<label>Access Type:</label> { instance.guest_access ? 'Guest Access' : 'Normal Access' }
						</span>
					</div>
					<div>
						<span>
							<label>Student Collaborators: </label> { instance.student_access ? 'Yes' : 'No' }
						</span>
					</div>
					<div>
						<span>
							<label>Embedded Only:</label> { instance.embedded_only ? 'Yes' : 'No' }
						</span>
					</div>
					<div>
						<span>
							<label>Embedded:</label> { instance.is_embedded ? 'Yes' : 'No' }
						</span>
					</div>
					<div>
						<span>
							<label>Open Time:</label> { !instance.open_at ? 'Forever' : `${new Date(instance.open_at).toLocaleString()}` }
						</span>
					</div>
					<div>
						<span>
							<label>Close Time:</label> { !instance.close_at ? 'Never' : `${new Date(instance.close_at).toLocaleString()}` }
						</span>
					</div>
					<div>
						<span>
							<label>Attempts Allowed:</label> { instance.attempts < 0 ? 'Unlimited' : instance.attempts }
						</span>
					</div>
					<div>
						<span>
							<label>Play URL:</label><a target='_blank' href={ instance.play_url }>{ instance.play_url }</a>
						</span>
					</div>
					<div>
						<span>
							<label>Preview URL:</label><a target='_blank' href={ instance.preview_url }>{ instance.preview_url }</a>
						</span>
					</div>
					<div>
						<span>
							<label>Embed URL:</label><a target='_blank' href={ instance.embed_url }>{ instance.embed_url }</a>
						</span>
					</div>
					<div className="manage-btn-container">
						<button className="action_button" onClick={() => setInstanceState(instanceState => ({...instanceState, manager: true}))}>{instanceState.manager ? 'Close Manager' : 'Manage Instance'}</button>
					</div>
				</div>
			:
				<div className="info-holder">
					{ errorRender }
					{ managerRender }
				</div>
			}
		</li>
	)
}

export default UserAdminInstanceAvailable