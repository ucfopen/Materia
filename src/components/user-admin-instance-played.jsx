import React, { useState } from 'react'
import { iconUrl } from '../util/icon-url'

const UserAdminInstancePlayed = ({play, index}) => {

	const [instanceState, setInstanceState] = useState({expanded: false})

	return (
		<li key={index} className={`instance ${instanceState.expanded ? 'expanded' : ''}`} onClick={() => setInstanceState(instanceState => ({...instanceState, expanded: !instanceState.expanded}))}>
			<div className='clickable widget-title'>
				<span className='img-holder'>
					<img src={iconUrl('/widget/', play.widget.dir, 275)} />
				</span>
				<span>
					<div className='title'>
						{ play.name }
					</div>
					<div>
						{ play.widget.name }
					</div>
				</span>
			</div>
			<div className="info-holder">
				<div>
					<label>Date:</label> { `${new Date(play.created_at*1000).toLocaleString()} (${play.created_at})` }
				</div>
				<div>
					<label>Score:</label> <a target="_blank" href={ '/scores/'+play.id+'/#single-'+play.play_id }>{ play.percent }%</a>
				</div>
				<div>
					<label>Time Elapsed:</label> { play.elapsed }s
				</div>
				<div>
					<label>Completed:</label> { play.is_complete == "1" ? 'Yes' : 'No' }
				</div>
				<div>
					<label>Context:</label> {play.auth == 'LTI' ? 'LTI' : 'Web' }
				</div>
			</div>
		</li>
	)
}

export default UserAdminInstancePlayed