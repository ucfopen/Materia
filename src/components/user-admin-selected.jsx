import React, { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import UserAdminInstanceAvailable from './user-admin-instance-available'
import UserAdminInstancePlayed from './user-admin-instance-played'
import useInstanceList from './hooks/useInstanceList'
import useGetPlaySessions from './hooks/useGetPlaySessions'
import UserAdminRoleManager from './user-admin-role-manager'
import { apiUpdateUser } from '../util/api'

const UserAdminSelected = ({selectedUser, currentUser, onReturn}) => {
	const queryClient = useQueryClient()
	const [updatedUser, setUpdatedUser] = useState({...selectedUser})
	const instancesOwned = useInstanceList(updatedUser.id)
	const userLogs = useGetPlaySessions(updatedUser.id, true)

	const [errorText, setErrorText] = useState('')
	const [successText, setSuccessText] = useState('')

	useEffect(() => {
		if (selectedUser && updatedUser && selectedUser.id != updatedUser.id) setUpdatedUser({...selectedUser})
	},[selectedUser])

	const handleChange = (attr, value) => {
		setUpdatedUser({...updatedUser, [attr]: value})
	}

	const applyChanges = () => {
		try {
			apiUpdateUser({
				id: updatedUser.id,
				email: updatedUser.email
			})
			.then((res) => {
				setSuccessText('User updated.')
			})
		}
		catch {
			setErrorText('User update failed.')
		}

	}

	const onCopySuccess = (instance) => {
		// optimistically update managed widget instances
		queryClient.setQueriesData('managed-widgets', (previous) => {
			return {
				...previous,
				instances_available: [ instance, ...previous.instances_available ]
			}
		})
	}

	let instancesAvailable = <span>Instances are loading...</span>
	if (!instancesOwned.isFetching) {
		if (!!instancesOwned && instancesOwned.instances.length > 0) {
				instancesAvailable = instancesOwned.instances?.map((instance, index) => {
					return (<UserAdminInstanceAvailable instance={instance} key={index} currentUser={currentUser} onCopySuccess={onCopySuccess}/>)
				})
		} else {
			instancesAvailable = <span>This user has not created or been granted access to any widgets.</span>
		}
	}

	let instancesPlayed = <span>Play history loading...</span>
	if (!userLogs.isFetching) {
		if (!!userLogs.plays && userLogs.plays.length > 0) {
			instancesPlayed = userLogs.plays?.map((play, index) => {
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
				<div className='breadcrumb'>{`${updatedUser.first_name} ${updatedUser.last_name}`}</div>
			</div>
			<div className='top'>
				<h1>{ `${updatedUser.first_name} ${updatedUser.last_name}` }</h1>
			</div>
			<div className='overview admin-subsection'>
				{errorText != '' ? <div className='error'><p>{errorText}</p></div> : <></> }
				{successText != '' ? <div className='success'><p>{successText}</p></div> : <></> }
				<span>
					<label>ID: </label>{ updatedUser.id }
				</span>
				<span>
					<label>Created: </label>{ new Date(updatedUser.date_joined).toLocaleString() }
				</span>
				<span>
					<label>Last login: </label>{ updatedUser.last_login != null ? `${new Date(updatedUser.last_login).toLocaleString()}` : 'No login on record' }
				</span>
				<span>
					<label>Username: </label>{ updatedUser.username }
				</span>
				<span>
					<label>Email: </label>
					<input type='text' onChange={(event) => handleChange('email', event.target.value)} value={updatedUser.email}></input>
					<button className='action_button apply'
						onClick={applyChanges}>
							<span>Apply</span>
					</button>
				</span>
				<span>
					<label>Roles: </label> { updatedUser.is_support_user ? 'Support, ' : '' } { updatedUser.is_student ? 'Student' : 'Instructor' }
				</span>
				<h3>User Settings</h3>
				<span>
					<label>Notifications: </label> NYI - Add Me!{ /*updatedUser.profile_fields.notify ? 'Enabled' : 'Disabled' */}
				</span>
				<span>
					<label>User Icon: </label>{ updatedUser.profile_fields.useGravatar ? 'Gravatar' : 'Default' }
				</span>
				<span>
					<label>Dark Mode: </label>{ updatedUser.profile_fields.darkMode ? 'Enabled' : 'Disabled' }
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