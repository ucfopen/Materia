import React, { useState } from 'react'
import useUpdateUserRoles from './hooks/useUpdateUserRoles'

const UserAdminRoleManager = ({currentUser, selectedUser}) => {

	const [roles, setRoles] = useState({
		student: selectedUser.is_student,
		author: !selectedUser.is_student,
		support_user: selectedUser.is_support_user
	})
	const [updateStatus, setUpdateStatus] = useState({
		status: null,
		message: ''
	})
	const userRolesMutation = useUpdateUserRoles()

	const toggleRole = (e) => {
		// note: student and author are mutually exclusive. A user cannot be both!
		switch (e.target.name) {
			case 'student':
				setRoles({...roles, student: !roles.student, author: roles.student})
				break
			case 'author':
				setRoles({...roles, author: !roles.author, student: roles.author})
				break
			case 'support':
				setRoles({...roles, support_user: !roles.support_user})
				break
		}
	}

	const submitUpdateRoles = () => {
		userRolesMutation.mutate({
			id: selectedUser.id,
			author: roles.author,
			support_user: roles.support_user,
			successFunc: (response) => {
				setUpdateStatus({
					status: response.success ? 'Successful.' : 'Error.',
					message: response.status
				})
			}
		})
	}

	let statusRender = null
	if (updateStatus.status != null) {
		statusRender = <dl className='update-status'>
			<dt>{updateStatus.status}</dt>
			<dd>{updateStatus.message}</dd>
		</dl>
	}

	return (
		<div className='admin-subsection role-manager'>
			<div className='top'>
				<h2>User Role Manager</h2>
			</div>
			<p>Current user roles:</p>
			<ul className='roles'>
				<li key='student'>
					<input type='checkbox' id='student' name='student' checked={roles.student == true} onChange={toggleRole}></input>
					<label>Student</label>
				</li>
				<li key='author'>
					<input type='checkbox' id='author' name='author' checked={roles.author == true} onChange={toggleRole}></input>
					<label>Author</label>
				</li>
				<li key='support'>
					<input type='checkbox' id='support' name='support' checked={roles.support_user == true} onChange={toggleRole}></input>
					<label>Support</label>
				</li>
			</ul>
			<button className='action_button' onClick={submitUpdateRoles}>Submit</button>
			{ statusRender }
		</div>
	)
}

export default UserAdminRoleManager