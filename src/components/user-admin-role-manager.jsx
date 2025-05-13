import React, { useState, useEffect } from 'react'
import useUpdateUserRoles from './hooks/useUpdateUserRoles'

const UserAdminRoleManager = ({selectedUser, roles}) => {

	const [updatedRoles, setRoles] = useState({
		student: false,
		author: false,
		support_user: false
	})
	const [updateStatus, setUpdateStatus] = useState({
		status: null,
		message: ''
	})
	const userRolesMutation = useUpdateUserRoles()

	useEffect(() => {
		if (!!roles) {
			setRoles({
				student: roles.student,
				author: roles.author,
				support_user: roles.support_user
			})
		}
	},[roles])

	const toggleRole = (e) => {
		// note: student and author are mutually exclusive. A user cannot be both!
		switch (e.target.name) {
			case 'student':
				setRoles({...updatedRoles, student: !updatedRoles.student, author: updatedRoles.student})
				break
			case 'author':
				setRoles({...updatedRoles, author: !updatedRoles.author, student: updatedRoles.author})
				break
			case 'support_user':
				setRoles({...updatedRoles, support_user: !updatedRoles.support_user})
				break
		}
	}

	const submitUpdateRoles = () => {
		userRolesMutation.mutate({
			id: selectedUser.id,
			student: updatedRoles.student,
			author: updatedRoles.author,
			support_user: updatedRoles.support_user,
			successFunc: (response) => {
				setUpdateStatus({
					status: 'Successful.',
					message: ''
				})
			},
			errorFunc: (err) => {
				setUpdateStatus({
					status: 'Error.',
					message: err.message
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
					<input type='checkbox' id='student' name='student' checked={updatedRoles.student == true} onChange={toggleRole}></input>
					<label>Student</label>
				</li>
				<li key='author'>
					<input type='checkbox' id='author' name='author' checked={updatedRoles.author == true} onChange={toggleRole}></input>
					<label>Author</label>
				</li>
				<li key='support'>
					<input type='checkbox' id='support' name='support_user' checked={updatedRoles.support_user == true} onChange={toggleRole}></input>
					<label>Support</label>
				</li>
			</ul>
			<button className='action_button' onClick={submitUpdateRoles}>Submit</button>
			{ statusRender }
		</div>
	)
}

export default UserAdminRoleManager