import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { apiGetInstancesForUser } from '../util/api'
import UserAdminInstanceAvailable from './user-admin-instance-available'
import UserAdminInstancePlayed from './user-admin-instance-played'
import UserAdminRoleManager from './user-admin-role-manager'

const UserAdminSelected = ({selectedUser, currentUser, onReturn}) => {

	const [updatedUser, setUpdatedUser] = useState({...selectedUser})

	const { data: widgets, isFetching: isLoadingWidgets} = useQuery({
		queryKey: ['managed-widgets', updatedUser.id],
		queryFn: () => apiGetInstancesForUser(updatedUser.id),
		placeholderData: null,
		staleTime: Infinity
	})

	useEffect(() => {
		if (selectedUser && updatedUser && selectedUser.id != updatedUser.id) setUpdatedUser({...selectedUser})
	},[selectedUser])

	const handleChange = (attr, value) => {
		setUpdatedUser({...updatedUser, [attr]: value})
	}

	let instancesAvailable = <span>Widgets are loading...</span>
	if (!isLoadingWidgets) {
		if (!!widgets.instances_available && widgets.instances_available.length > 0) {
				instancesAvailable = widgets.instances_available?.map((instance, index) => {
					return (<UserAdminInstanceAvailable instance={instance} key={index} currentUser={currentUser}/>)
				})
		} else {
			instancesAvailable = <span>This user has not created or been granted access to any widgets.</span>
		}
	}

	let instancesPlayed = <span>Play history loading...</span>
	if (!isLoadingWidgets) {
		if (!!widgets.instances_played && widgets.instances_played.length > 0) {
			instancesPlayed = widgets.instances_played?.map((play, index) => {
				return (<UserAdminInstancePlayed play={play} key={index} />)
			})
		} else {
			instancesPlayed = <span>This user has not played any widgets.</span>
		}
	}

	let suRender = null
	if (currentUser?.is_super_user) {
		suRender = <UserAdminRoleManager currentUser={currentUser} selectedUser={selectedUser} />
	}

	return (
		<section className='page inst-info'>
			<div id='breadcrumb-container'>
				<div className='breadcrumb'>
					<a href='/admin/user'>User Search</a>
				</div>
				<svg xmlns='http://www.w3.org/2000/svg'
					width='24'
					height='24'
					viewBox='0 0 24 24'>
					<path d='M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z'/>
					<path fill='none' d='M0 0h24v24H0V0z'/>
				</svg>
				<div className='breadcrumb'>{`${updatedUser.first} ${updatedUser.last}`}</div>
			</div>
			<div className='top'>
				<h1>{ `${updatedUser.first} ${updatedUser.last}` }</h1>
			</div>
			<div className='overview admin-subsection'>
				<span>
					<label>ID: </label>{ updatedUser.id }
				</span>
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
					<label>Roles: </label> { updatedUser.is_support_user ? 'Support, ' : '' } { updatedUser.is_student ? 'Student' : 'Instructor' }
				</span>
				<h3>User Settings</h3>
				<span>
					<label>Notifications: </label>{ updatedUser.profile_fields.notify ? 'Enabled' : 'Disabled' }
				</span>
				<span>
					<label>User icon: </label>{ updatedUser.profile_fields.useGravatar ? 'Gravatar' : 'Default' }
				</span>
			</div>
			<div className='info-holder'>
				{ suRender }
				<div className='instances admin-subsection'>
					<div className='top'>
						<h2>Owned or Managed Instances:</h2>
					</div>
					<ul>
						{ instancesAvailable }
					</ul>
				</div>
				<div className='instances admin-subsection'>
					<div className='top'>
						<h2>Instance Play History:</h2>
					</div>
					<ul>
						{ instancesPlayed }
					</ul>
				</div>
			</div>
		</section>
	)
}

export default UserAdminSelected