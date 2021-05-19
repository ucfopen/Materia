import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { apiGetUser, apiAuthorSuper, apiAuthorSupport, apiGetNotifications } from '../util/api'
import useDeleteNotification from './hooks/useDeleteNotification'
import './header.scss'

const Header = ({
	userRoles = [],
	userNotify = true,
	allowLogins = true
}) => {
	const [menuOpen, setMenuOpen] = useState(false)
	const [navOpen, setNavOpen] = useState(false)
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
	const { data: notifications} = useQuery({
		queryKey: 'notifications',
		queryFn: apiGetNotifications,
		staleTime: Infinity
	})
	const deleteNotification = useDeleteNotification()
	const cn = user?.loggedIn ? 'logged-in' : ''

	const logoutUser = () => {
		sessionStorage.clear()
		window.location.href = "/users/logout"
	}

	return (
		<header className={cn} >
			{ !user
				? <span id="current-user" data-logged-in="false"></span>
				: <span id="current-user"
						data-logged-in="true"
						data-name={`${user.first} ${user.last}`}
						data-avatar={user.avatar}
						data-role={userRoles.includes('author') ? 'Staff' : 'Student'}
						data-notify={userNotify}
					></span>
			}

			<h1 className="logo"><a href="/">Materia</a></h1>

			{	!userLoading
				?	<span>
						<p className="user avatar">
							{ user != undefined
								? <a href="/profile">
										<span>{`${user.first} ${user.last}`}</span>
										<img src={user.avatar} />
									</a>
								: null
							}
							{ user
								? <span className="logout">
										<a onClick={logoutUser}>Logout</a>
									</span>
								: null
							}

							{ allowLogins && ! user
								? <a href="/users/login">Login</a>
								: null
							}
						</p>
					</span>
				: null
			}

			<button
				id="mobile-menu-toggle"
				className={menuOpen ? 'expanded' : ''}
				onClick={() => {setMenuOpen(!menuOpen)}}
			>
				<div></div>
			</button>

			<nav>
				<ul>
					<li><a href="/widgets" >Widget Catalog</a></li>
					<li><a href="/my-widgets">My Widgets</a></li>
					<li><a href="/widgets/mywidgets2">MW React</a></li>
					{ user
						? <li>
							<a href="/profile">My Profile</a>
							</li>
						: null
					}
					<li><a href="/help">Help</a></li>

					{ isAdmin
						? <li className="nav_expandable">
								<span className='elevated'>Admin</span>
								<ul>
									<li>
										<a className='elevated' href="/admin/widget">Widgets</a>
									</li>
									<li>
										<a className='elevated' href="/admin/user">Users</a>
									</li>
									<li>
										<a className='elevated' href="/admin/support">Support</a>
									</li>
								</ul>
							</li>
						: null
					}

					{ isSupport
						? <li className="nav_expandable">
								<span className='elevated'>Support</span>
								<ul>
									<li>
										<a className='elevated' href="/admin/user">Users</a>
									</li>
									<li>
										<a className='elevated' href="/admin/support">Support</a>
									</li>
								</ul>
							</li>
						: null
					}

					{ user
						? <li>
								<span className="logout">
									<a href="/users/logout">Logout</a>
								</span>
							</li>
						: null
					}

				</ul>
			</nav>

			{ user && notifications?.length > 0
				? <>
					<a
						id="notifications_link"
						data-notifications={notifications.length}
						onClick={ () => { setNavOpen(!navOpen) } }
					></a>
					<div id="notices" className={navOpen ? 'open' : ''}>
						{ notifications.map(notification => (
							<div className={`notice ${notification.deleted ? 'deleted' : ''}`}
								key={notification.id}>
								<p className="icon">
									<img className="senderAvatar" src={notification.avatar} />
								</p>
								<div className="notice_right_side">
									<div dangerouslySetInnerHTML={{__html: `<p class="subject">${notification.subject}</p>`}}></div>
								</div>
								<span
									className="noticeClose"
									onClick={() => {deleteNotification.mutate(notification.id)}}
								></span>
							</div>
						))
						}
					</div>
					</>
				: null
			}

		</header>
	)
}

export default Header
