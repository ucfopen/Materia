import React, { useState } from 'react'
import { iconUrl } from '../util/icon-url'
import ScoreLtiResubmit from './score-lti-resubmit'

const UserAdminInstancePlayed = ({play, index}) => {

	const [instanceState, setInstanceState] = useState({expanded: false})
	const [resubmitted, setHasResubmitted] = useState(false)
	const [playStatus, setPlayStatus] = useState(play.submission_status ?? 'Legacy (No Status Available)')
	const playedDate = new Date(play.created_at)

	const ltiResubmitCallback = (status) => {
		setHasResubmitted(true)
		setPlayStatus(status)
	}

	return (
		<li key={index} className={`instance ${instanceState.expanded ? 'expanded' : ''}`} onClick={() => setInstanceState(instanceState => ({...instanceState, expanded: !instanceState.expanded}))}>
			<div className='clickable widget-title'>
				<span className='img-holder'>
					<img src={iconUrl('/widget/', play.widget_icon, 275)} alt=""/>
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
					<label>Score:</label> <a target="_blank" href={ `/scores/single/${play.instance}/${play.id}` }>{ Math.round(play.percent) }%</a>
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
					<>
						<div className={`submission-status ${resubmitted ? 'updated' : ''}`}>
							<label>Submission Status:</label> { playStatus }
						</div>
						{ playStatus == 'ERR_FAILURE' && (
							<ScoreLtiResubmit
								lti={{submission_available: true, submit_attempts: 0, adminMode: true}}
								playId={play.id}
								callback={ltiResubmitCallback}
							/>
						)}
					</>
				)}
				<div>

				</div>
			</div>
		</li>
	)
}

export default UserAdminInstancePlayed