import React, { useState } from 'react'
import { iconUrl } from '../util/icon-url'

const UserAdminInstancePlayed = ({play, index}) => {

	const [instanceState, setInstanceState] = useState({expanded: false})
	const playedDate = new Date(play.created_at)

	return (
		<li key={index} className={`instance ${instanceState.expanded ? 'expanded' : ''}`} onClick={() => setInstanceState(instanceState => ({...instanceState, expanded: !instanceState.expanded}))}>
			<div className='clickable widget-title'>
				<span className='img-holder'>
					<img src={iconUrl('/widget/', play.widget_icon, 275)} />
				</span>
				<span className='title-holder'>
					<div className='title'>
						{ play.inst_name }
					</div>
					<div>
						{ play.widget_name }
					</div>
				</span>
				<span className='incomplete-status-holder'>
					{ play.is_complete ? '' : '[Incomplete]' }
				</span>
				<span className='date-holder'>
					{ playedDate.toLocaleDateString() }
				</span>
			</div>
			<div className="info-holder">
				<div>
					<label>Date:</label> { `${playedDate.toLocaleString()}` }
				</div>
				<div>
					<label>Score:</label> <a target="_blank" href={ `/scores/single/${play.instance}/${play.id}` }>{ play.percent }%</a>
				</div>
				<div>
					<label>Time Elapsed:</label> { play.elapsed }s
				</div>
				<div>
					<label>Completed:</label> { play.is_complete ? 'Yes' : 'No' }
				</div>
				<div>
					<label>Context:</label> {play.auth && typeof play.auth == 'string' && play.auth.toLowerCase() == 'lti' ? 'LTI' : 'Web' }
				</div>
				<div>
					<label>Context ID:</label> { play.context_id ? play.context_id : 'N/A' }
				</div>
				{ play.auth == 'lti' && (
					<div>
						<label>Submission Status:</label> { play.submission_status ? play.submission_status : 'Legacy (No Status Available)' }
					</div>
				)}
				<div>

				</div>
			</div>
		</li>
	)
}

export default UserAdminInstancePlayed