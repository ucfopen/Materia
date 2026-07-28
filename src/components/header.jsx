import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { apiGetUser, apiUserVerify, apiGetSiteMessages } from '../util/api'
import Notifications from './notifications'

const Header = ({
	allowLogins = true
}) => {
	const [menuOpen, setMenuOpen] = useState(false)
	const [optionsOpen, setOptionsOpen] = useState(false)

	const [user, setUser] = useState(null)
	const [verified, setVerified] = useState(false)
	const [permLevel, setPermLevel] = useState('anonymous')

	const [headerNotification, setHeaderNotification] = useState(null)
	const [headerAlert, setHeaderAlert] = useState(null)

	const { data: userPerms } = useQuery({
		queryKey: 'isLoggedIn',
		queryFn: apiUserVerify,
		staleTime: Infinity,
		retry: false
	})
	const { data: userData, isLoading: userLoading} = useQuery({
		queryKey: ['user', 'me'],
		queryFn: () => apiGetUser('me'),
		staleTime: Infinity,
		enabled: !!verified
	})

	const {data: siteMessages } = useQuery({
		queryKey: ['site-messages', 'notification', 'alert'],
		queryFn: () => apiGetSiteMessages(['SITE_NOTIFICATION', 'SITE_ALERT']),
		staleTime: Infinity,
		retry: false,
		refetchOnWindowFocus: false
	})

	useEffect(() => {
		if (siteMessages != undefined) {
			siteMessages.forEach((msg) => {
				if (msg.message_type == 'SITE_NOTIFICATION') setHeaderNotification(msg.message_text)
				else if (msg.message_type == 'SITE_ALERT') setHeaderAlert(msg.message_text)
			})
		}
	},[siteMessages])

	useEffect(() => {
		if (userData != undefined) {
			setUser(userData)
		}
	},[userData])

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
			<li className='nav_expandable admin'>
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
					<li>
						<a className='elevated' href='/admin/site'>Site</a>
					</li>
					<li>
						<a className='elevated' href='/admin/library'>Library</a>
					</li>
					<li>
						<a className='elevated' href='/admin/' target="_blank">Django Admin</a>
					</li>
				</ul>
			</li>
		)
	}
	else if (permLevel == 'support_user') {
		elevatedPermsNavRender = (
			<li className='nav_expandable support'>
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
	let notificationRender = null
	let userRender = null
	if (!userLoading) {
		let userAvatarRender = null
		let loginRender = null

		if (userPerms?.isAuthenticated && !!user) {

			notificationRender = <Notifications user={user}/>

			profileNavRender = (
				<li>
					<a href='/profile'>My Profile</a>
				</li>
			)
			userAvatarRender = (
				<>
					<div className="profile-bar-options">
						<a href='/profile' aria-label='Visit your profile page.'>{`${user.first_name} ${user.last_name}`}</a>
						<a onClick={logoutUser}>Logout</a>
					</div>
					<a href='/profile' aria-label='User avatar. Click to visit your profile page.'>
						<img src={user.avatar} onClick={showUserOptions} alt=""/>
					</a>
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
							<span>{`${user.first_name} ${user.last_name}`}</span>
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

	let siteNotificationRender = null

	if (headerNotification != null) {
		siteNotificationRender = (
			<section className='site-notification'>
				<img className="warning-icon" src="/img/warning.svg" alt="" />
				{headerNotification}
			</section>
		)
	}

	let siteAlertRender = null
	if (headerAlert != null) {
		siteAlertRender = (
			<section className='site-alert'>
				<img className="warning-icon" src="/img/warning.svg" alt="" />
				{headerAlert}
			</section>
		)
	}

	return (
		<header className={userData ? 'logged-in' : 'logged-out'} >
			{siteAlertRender}
			{siteNotificationRender}
			<h1 className='logo'><a href='/' aria-label='Materia'></a></h1>
			<nav>
				<ul>
					<li>
						<a href='/widgets/' >Widget Catalog</a>
					</li>
					<li>
						<a href='/community-library'>Community Library</a>
					</li>
					<li>
						<a href='/my-widgets/'>My Widgets</a>
					</li>
					{ profileNavRender }
					<li>
						<a href='/help/'>Help</a>
					</li>

					{ elevatedPermsNavRender }

					{ logoutNavRender }
				</ul>
			</nav>
			{ userRender }
			<div className="mobile-notifications">
				{ notificationRender }
			</div>
			<button id='mobile-menu-toggle'
				aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
				className={menuOpen ? 'expanded' : ''}
				onClick={toggleMobileNavMenu}>
				<div/>
			</button>

		</header>
	)
}

export default Header
