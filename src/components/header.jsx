import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import './header.scss'

// {
// 	deleted: false,
// 	avatar: '',
// 	id: 1,
// 	subject: 'stuff'
// }

const Header = ({
	loggedIn = true,
	isGuest = false,
	userAvatar = 'https://secure.gravatar.com/avatar/14707c40f71ff09565e3a10b3217bddc?s=35&d=retro',
	userFirst = 'Test',
	userLast = 'Student',
	userRoles = [],
	userNotify = true,
	allowLogins = true,
	isAdmin = true,
	notifications = [],
	removeNotification = () => {}
}) => {
	const [menuOpen, setMenuOpen] = useState(false);
	const [navOpen, setNavOpen] = useState(false);
	const cn = loggedIn ? 'logged-in' : ''

	return (
		<header className={cn} >
			{ isGuest
				? <span id="current-user" data-logged-in="false"></span>
				: <span id="current-user"
						data-logged-in="true"
						data-name={`${userFirst} ${userLast}`}
						data-avatar={userAvatar}
						data-role={userRoles.includes('author') ? 'Staff' : 'Student'}
						data-notify={userNotify}
					></span>

			}

			<h1 className="logo"><a href="/">Materia</a></h1>

			<span>
				<p className="user avatar">
					{ loggedIn
						? <a href="/profile">
								<span>{`${userFirst} ${userLast}`}</span>
								<img src={userAvatar} />
							</a>
						: null
					}
					{ loggedIn
						? <span className="logout">
								<a href="/users/logout">Logout</a>
							</span>
						: null
					}

					{ allowLogins && ! loggedIn
						? <a href="/users/login">Login</a>
						: null
					}
				</p>
			</span>

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
					{ loggedIn
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
								</ul>
							</li>
						: null
					}

					{ loggedIn
						? <li>
								<span className="logout">
									<a href="/users/logout">Logout</a>
								</span>
							</li>
						: null
					}

				</ul>
			</nav>

			{ notifications.length
				? <>
					<a
						id="notifications_link"
						data-notifications={notifications.length}
						onClick={ () => { setNavOpen(!navOpen) } }
					></a>
					<div id="notices" className={navOpen ? 'open' : ''}>
						{ notifications.map(notification => (
							<div className={`notice ${notification.deleted ? 'deleted' : ''}`}>
								<p className="icon">
									<img className="senderAvatar" src={userAvatar} />
								</p>
								<div className="notice_right_side">
									<p className="subject">{notification.subject}</p>
								</div>
								<span
									className="noticeClose"
									onClick={() => {removeNotification(notification.id)}}
								></span>
							</div>
						))}

					</div>
					</>
				: null
			}

		</header>
	)
}

export default Header
