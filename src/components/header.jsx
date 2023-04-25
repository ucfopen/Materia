import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { apiGetUser, apiAuthorSuper, apiAuthorSupport } from '../util/api'
import Notifications from './notifications'

const Header = ({
	allowLogins = true
}) => {
	const [menuOpen, setMenuOpen] = useState(false)
	const { data: user, isLoading: userLoading} = useQuery({
		queryKey: 'user',
		queryFn: apiGetUser,
		staleTime: Infinity
	})
	const { data: isAdmin} = useQuery({
		queryKey: 'isAdmin',
		queryFn: apiAuthorSuper,
		staleTime: Infinity
	})
	const { data: isSupport} = useQuery({
		queryKey: 'isSupport',
		queryFn: apiAuthorSupport,
		staleTime: Infinity
	})

	const toggleMobileNavMenu = () => setMenuOpen(!menuOpen)

	const logoutUser = () => {
		sessionStorage.clear()
		window.location.href = '/users/logout'
	}

	let userDataRender = <span id='current-user' data-logged-in='false'></span>

	let profileNavRender = null

	let adminNavRender = null
	if (isAdmin) {
		adminNavRender = (
			<li className='nav_expandable'>
				<span className='elevated admin'>Admin</span>
				<ul>
					<li>
						<a className='elevated' href='/admin/widget'>Widgets</a>
					</li>
					<li>
						<a className='elevated' href='/admin/user'>Users</a>
					</li>
					<li>
						<a className='elevated' href='/admin/instance'>Instances</a>
					</li>
				</ul>
			</li>
		)
	}

	let supportNavRender = null
	if (isSupport) {
		supportNavRender = (
			<li className='nav_expandable'>
				<span className='elevated support'>Support</span>
				<ul>
					<li>
						<a className='elevated' href='/admin/user'>Users</a>
					</li>
					<li>
						<a className='elevated' href='/admin/instance'>Instances</a>
					</li>
				</ul>
			</li>
		)
	}

	/*
	There will seemingly be two 'Logout' links when a user is logged in - one is inline with the
	user name and avatar, the second is invisible unless the screen is extremely narrow, at which point
	it becomes visible alongside all other nav options in the expanded hamburger menu.
	This variable will account for the second Logout link.
	*/
	let logoutNavRender = null

	let userRender = null
	if (!userLoading) {
		let nameAvatarRender = null
		let loginRender = null

		// this used to be !!user - not sure if the distinction was important
		if (user) {

			profileNavRender = (
				<li>
					<a href='/profile'>My Profile</a>
				</li>
			)

			nameAvatarRender = (
				<a href='/profile'>
					<span>{`${user.first} ${user.last}`}</span>
					<img src={user.avatar} />
				</a>
			)

			loginRender = (
				<span className='logout'>
					<Notifications user={user}/>
					<a onClick={logoutUser}>Logout</a>
				</span>
			)

			logoutNavRender = (
				<li>
					<span className='logout'>
						<a href='/users/logout'>Logout</a>
					</span>
				</li>
			)

		} else {
			if (allowLogins) {
				loginRender = <a href='/users/login'>Login</a>
			}
		}

		userRender = (
			<div className='user avatar'>
				{ nameAvatarRender }
				{ loginRender }
			</div>
		)
	}

	return (
		<header className={user ? 'logged-in' : 'logged-out'} >
			<h1 className='logo'><a href='/'>Materia</a></h1>
			{ userRender }
			<button id='mobile-menu-toggle'
				className={menuOpen ? 'expanded' : ''}
				onClick={toggleMobileNavMenu}>
				<div/>
			</button>

			<nav>
				<ul>
					<li>
						<a href='/widgets' >Widget Catalog</a>
					</li>
					<li>
						<a href='/my-widgets'>My Widgets</a>
					</li>
					{ profileNavRender }
					<li>
						<a href='/help'>Help</a>
					</li>

					{ adminNavRender }
					{ supportNavRender }

					{ logoutNavRender }
				</ul>
			</nav>

		</header>
	)
}

export default Header
