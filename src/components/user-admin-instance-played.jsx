import React, { useState } from 'react'
import { iconUrl } from '../util/icon-url'

const UserAdminInstancePlayed = ({play, index}) => {

	const [instanceState, setInstanceState] = useState({expanded: false})
	const playedDate = new Date(play.created_at*1000).toLocaleString()

	return (
		<li key={index} className={`instance ${instanceState.expanded ? 'expanded' : ''}`} onClick={() => setInstanceState(instanceState => ({...instanceState, expanded: !instanceState.expanded}))}>
			<div className='clickable widget-title'>
				<span className='img-holder'>
					<img src={iconUrl('/widget/', play.widget.dir, 275)} />
				</span>
				<span className='title-holder'>
					<div className='title'>
						{ play.name }
					</div>
					<div>
						{ play.widget.name }
					</div>
				</span>
				<span className='incomplete-status-holder'>
					{ parseInt(play.is_complete) ? '' : '[Incomplete]' }
				</span>
				<span className='date-holder'>
					{ playedDate }
				</span>
			</div>
			<div className="info-holder">
				<div>
					<label>Date:</label> { `${playedDate} (${play.created_at})` }
				</div>
				<div>
					<label>Score:</label> <a target="_blank" href={ `/scores/single/${play.play_id}/${play.id}` }>{ play.percent }%</a>
				</div>
				<div>
					<label>Time Elapsed:</label> { play.elapsed }s
				</div>
				<div>
					<label>Completed:</label> { play.is_complete == "1" ? 'Yes' : 'No' }
				</div>
				<div>
					<label>Context:</label> {play.auth && typeof play.auth == 'string' && play.auth.toLowerCase() == 'lti' ? 'LTI' : 'Web' }
				</div>
			</div>
		</li>
	)
}

export default UserAdminInstancePlayed