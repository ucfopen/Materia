import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { apiGetInstancesForUser } from '../util/api'
import UserAdminInstanceAvailable from './user-admin-instance-available'
import UserAdminInstancePlayed from './user-admin-instance-played'

const UserAdminSelected = ({user, selectedUser, onReturn}) => {

	const [updatedUser, setUpdatedUser] = useState({...user})

	const { data: widgets, isFetching: isLoadingWidgets} = useQuery({
		queryKey: 'widgets',
		queryFn: () => apiGetInstancesForUser(updatedUser.id),
		placeholderData: null,
		staleTime: Infinity
	})

	const handleChange = (attr, value) => {
		setUpdatedUser({...updatedUser, [attr]: value})
	}

	const instancesAvailable = isLoadingWidgets ? 
		<span>Widgets are loading...</span> : 
		widgets.instances_available?.map((instance, index) => {
			return (<UserAdminInstanceAvailable instance={instance} key={index} />)
		})

	const instancesPlayed = isLoadingWidgets ? 
		<span>Play history loading...</span> :
		widgets.instances_played?.map((play, index) => {
			return (<UserAdminInstancePlayed play={play} key={index} />)
		})

	return (
		<section className='page inst-info'>
			<div>
				<button 
						className='action_button back' 
						onClick={() => {onReturn()}}>
					<span className='arrow'></span>
					<span className='goBackText'>Return</span>
				</button>
			</div>
			<div className='header'>
				{ `${updatedUser.first} ${updatedUser.last}` }
			</div>
			<div className='overview'>
				<span>
					<label>Created: </label>{ updatedUser.created_at }
				</span>
				<span>
					<label>Last login: </label>{ updatedUser.last_login }
				</span>
				<span>
					<label>Username: </label>{ updatedUser.username }
				</span>
				<span>
					<label>Email: </label><input type='text' onChange={(event) => handleChange('email', event.target.value)} value={updatedUser.email}></input>
				</span>
				<span>
					<label>Role: </label> NYI (is student?: { updatedUser.is_student ? 'true' : 'false' })
				</span>
				<span>
					<label>Notifications: </label>{ updatedUser.profile_fields.notify ? 'Enabled' : 'Disabled' }
				</span>
				<span>
					<label>User icon: </label>{ updatedUser.profile_fields.useGravatar ? 'Gravatar' : 'Default' }
				</span>
			</div>
			<div className="info-holder">
				<div className="instances">
					<div className="top">
						<h1>Instances Available:</h1>
					</div>
					<ul>
						{ instancesAvailable }
					</ul>
				</div>
				<div className="instances">
					<div className="top">
						<h1>Instances Played:</h1>
						<ul>
							{ instancesPlayed }
						</ul>
					</div>
				</div>
			</div>
		</section>
		
		

		// avatar icon, name
		// created: static date
		// last login: static date
		// username: static string value
		// email: input box
		// role: drop-down
		// notifications: checkmark true/false
		// user icon: drop-down

		// instances available section
		// instances played section

		// save changes btn
	)
}

export default UserAdminSelected