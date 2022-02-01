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
			<div id="breadcrumb-container">
				<div className="breadcrumb">
					<a href="/admin/user">User Search</a>
				</div>
				<svg xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24">
					<path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
					<path fill="none" d="M0 0h24v24H0V0z"/>
				</svg>
				<div className="breadcrumb">{`${updatedUser.first} ${updatedUser.last}`}</div>
			</div>
			<div className='top'>
				<h1>{ `${updatedUser.first} ${updatedUser.last}` }</h1>
			</div>
			<div className='overview'>
				<span>
					<label>Created: </label>{ new Date(updatedUser.created_at * 1000).toLocaleString() } ({ updatedUser.created_at })
				</span>
				<span>
					<label>Last login: </label>{ updatedUser.last_login > 0 ? `${new Date(updatedUser.last_login * 1000).toLocaleString()} ( ${updatedUser.last_login} )` : 'No login on record' }
				</span>
				<span>
					<label>Username: </label>{ updatedUser.username }
				</span>
				<span>
					<label>Email: </label><input type='text' onChange={(event) => handleChange('email', event.target.value)} value={updatedUser.email}></input>
				</span>
				<span>
					<label>Role: </label> { updatedUser.is_student ? 'Student' : 'Instructor' }
				</span>
				<h3>User Settings</h3>
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
						<h2>Owned or Managed Instances:</h2>
					</div>
					<ul>
						{ instancesAvailable }
					</ul>
				</div>
				<div className="instances">
					<div className="top">
						<h2>Instance Play History:</h2>
					</div>
					<ul>
						{ instancesPlayed }
					</ul>
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