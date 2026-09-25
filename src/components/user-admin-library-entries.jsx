import React, { useState } from 'react'
import { iconUrl } from '../util/icon-url'

const UserAdminLibraryEntries = ({entry, index}) => {

	const [entryState, setEntryState] = useState({
		expanded: false,
		manager: false
	})

	return (
		<li key={index} className={`library-entry ${entryState.expanded ? 'expanded' : ''}`}>
			<div className={`clickable widget-title ${entryState.manager ? 'hidden' : ''}`}
		onClick={() => setEntryState(entryState => ({...entryState, expanded: !entryState.expanded, manager: false}))}>
				<span className='img-holder'>
					<img src={iconUrl('/widget/', entry.widget.dir, 275)} alt=""/>
				</span>
				<span className='title-holder'>
					<div className='title'>
						{ entry.instance_name }
					</div>
					<div>
						{ entry.widget.name }
					</div>
				</span>
			</div>
			{ !entryState.manager ?
				<div className={`info-holder`}>
					<div>
						<span>
							<label>ID:</label> { entry.id }
						</span>
					</div>
					<div>
						<span>
							<label>Created:</label> { `${new Date(entry.created_at).toLocaleDateString()}` }
						</span>
					</div>
					<div>
						<span>
							<label>Category:</label> { entry.category }
						</span>
					</div>
					<div>
						<span>
							<label>Course Level:</label> { entry.course_level }
						</span>
					</div>
					<div>
						<span>
							<label>Featured:</label> { entry.featured ? 'Yes' : 'No' }
						</span>
					</div>
					<div>
						<span>
							<label>Library Visibility: </label> { entry.is_available ? 'Published' : 'Unpublished' }
						</span>
					</div>
					<div>
						<span>
							<label>Copy Count:</label> { entry.copy_count }
						</span>
					</div>
					<div>
						<span>
							<label>Like Count:</label> { entry.like_count }
						</span>
					</div>
					<div>
						<span>
							<label>Report Count:</label> { entry.report_count }
						</span>
					</div>
					<div>
						<span>
							<label>Banned:</label> { entry.is_banned ? 'Yes' : 'No' }
						</span>
					</div>
					<div>
						<span>
							<label>Tags:</label> { entry.tags.join(', ') }
						</span>
					</div>
					<div>
						<span>
							<label>Instance admin:</label><a target='_blank' href={ `/admin/instance#${entry.instance_id}` }>Visit</a>
						</span>
					</div>
					<div>
						<span>
							<label>Library listing:</label><a target='_blank' href={ `/community-library/${entry.id}` }>Visit</a>
						</span>
					</div>
				</div>
			: <></> }
		</li>
	)
}

export default UserAdminLibraryEntries