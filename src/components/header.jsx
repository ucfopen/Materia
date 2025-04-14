import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { apiGetUser, apiUserVerify } from '../util/api'
import Notifications from './notifications'

const Header = ({
	allowLogins = true
}) => {
	const [menuOpen, setMenuOpen] = useState(false)
	const [optionsOpen, setOptionsOpen] = useState(false)

	const [verified, setVerified] = useState(false)
	const [permLevel, setPermLevel] = useState('anonymous')

	const { data: userPerms } = useQuery({
		queryKey: 'isLoggedIn',
		queryFn: apiUserVerify,
		staleTime: Infinity,
		retry: false
	})
	const { data: user, isLoading: userLoading} = useQuery({
		queryKey: ['user', 'me'],
		queryFn: ({ queryKey }) => {
			const [_key, user] = queryKey
			return apiGetUser(user)
		},
		staleTime: Infinity,
		enabled: !!verified
	})

	useEffect(() => {
		if (userPerms != undefined) {
			
			setVerified(!!userPerms.isAuthenticated)
			setPermLevel(userPerms.permLevel ?? 'anonymous')
		}
	},[userPerms])

	const toggleMobileNavMenu = () => setMenuOpen(!menuOpen)

	const logoutUser = () => {
		sessionStorage.clear()
		window.location.href = '/users/logout'
	}

	const showUserOptions = () => {
		setOptionsOpen(!optionsOpen);
	}

	let profileNavRender = null

	let elevatedPermsNavRender = null
	if (permLevel == 'super_user') {
		elevatedPermsNavRender = (
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
	else if (permLevel == 'support_user') {
		elevatedPermsNavRender = (
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
	let profileMenuRender = null
	let notificationRender = null;

	let userRender = null
	if (!userLoading) {
		let userAvatarRender = null;
		let loginRender = null;

		// this used to be !!user - not sure if the distinction was important
		if (user) {

			notificationRender = <Notifications user={user}/>

			profileNavRender = (
				<li>
					<a href='/profile'>My Profile</a>
				</li>
			)
			userAvatarRender = (
				<>
					<div className="profile-bar-options">
						<a href='/profile'>{`${user.first} ${user.last}`}</a>
						<a onClick={logoutUser}>Logout</a>
					</div>
					<a href='/profile'><img src={user.avatar} onClick={showUserOptions}/></a>
				</>
			)

			logoutNavRender = (
				<li>
					<span className='logout'>
						<a href='/users/logout'>Logout</a>
					</span>
				</li>
			)

			// A dropdown menu for the profile icon
			// Not being used
			profileMenuRender = (
				<nav className={`profile-menu ${optionsOpen ? 'show' : ''}`}>
					<span className="arrow-top"></span>
					<ul>
						<li>
							<span>{`${user.first} ${user.last}`}</span>
						</li>
						<li>
							<a href='/profile'>Profile</a>
						</li>
						{ logoutNavRender }
					</ul>
				</nav>
			)

		} else {
			if (allowLogins) {
				loginRender = <a href='/login' id="loginLink">Login</a>
			}
		}

		userRender = (
			<div className="profile-bar">
				<div className="desktop-notifications">
					{ notificationRender }
				</div>
				{ userAvatarRender }
				{ loginRender }
			</div>
		)
	}

	return (
		<header className={user ? 'logged-in' : 'logged-out'} >
			<h1 className='logo'><a href='/'>Materia</a></h1>
			{ userRender }
			<div className="mobile-notifications">
				{ notificationRender }
			</div>
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

					{ elevatedPermsNavRender }

					{ logoutNavRender }
				</ul>
			</nav>

		</header>
	)
}

export default Header
