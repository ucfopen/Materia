import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import fetchOptions from '../util/fetch-options'
import './header.scss'

// {
// 	deleted: false,
// 	avatar: '',
// 	id: 1,
// 	subject: 'stuff'
// }
const fetchAuthorSuper = () => fetch('/api/json/session_author_verify/', fetchOptions({body: `data=${encodeURIComponent(JSON.stringify(['super_user']))}`}))
const fetchAuthorSupport = () => fetch('/api/json/session_author_verify/', fetchOptions({body: `data=${encodeURIComponent(JSON.stringify(['support_user']))}`}))
const fetchCurrentUser = () => fetch('/api/json/user_get/')
const fetchNotifications = () => fetch('/api/json/notifications_get/')
const fetchNotificationDelete = (notifId) => fetch('/api/json/notification_delete/', fetchOptions({body: "data=" + encodeURIComponent(`[${notifId}]`)}))

const initState = {
	loggedIn: false,
	isGuest: false,
	userAvatar: 'https://secure.gravatar.com/avatar/14707c40f71ff09565e3a10b3217bddc?s=35&d=retro',
	userFirst: 'doesnt',
	userLast: 'work, yet',
	isAdmin: false,
	isSupport: false,
	useGravatar: true,
	isLoading: true,
	notifications: []
}

const Header = ({
	userRoles = [],
	userNotify = true,
	allowLogins = true
}) => {
	const [menuOpen, setMenuOpen] = useState(false);
	const [navOpen, setNavOpen] = useState(false);
	const [state, setState] = useState(initState)
	const cn = state.loggedIn ? 'logged-in' : ''
	const mounted = useRef(false)

	// Tells if the component is mounted
	useEffect(() => {
    mounted.current = true
    return () => (mounted.current = false)
  }, [])

	// Handles receiving current data from API
	useEffect(() => {
		let promiseArr = []
		let _state = {...state}

		// Gets the general user information
		promiseArr.push(fetchCurrentUser()
		.then(resp => {
			// no content
			if(resp.status === 502 || resp.status === 204) {
				return null
			}
			
			return resp.json()
		})
		.then(data => {
			if (data && data.halt != true) {
				_state.loggedIn = true
				_state.isGuest = false
				_state.userAvatar = data.avatar
				_state.userFirst = data.first
				_state.userLast = data.last
				_state.useGravatar = data.profile_fields.useGravatar
			}
		}))

		// Checks if the user is an admin
		promiseArr.push(fetchAuthorSuper()
		.then(resp => {
			// no content
			if(resp.status === 502 || resp.status === 204) {
				return false
			}
			
			return resp.json()
		})
		.then(data => {
			if(data) {
				_state.isAdmin = true
			}
		}))

		promiseArr.push(fetchAuthorSupport()
		.then(resp => {
			// no content
			if(resp.status === 502 || resp.status === 204) {
				return false
			}
			
			return resp.json()
		})
		.then(data => {
			if(data) {
				_state.isSupport = true
			}
		}))

		promiseArr.push(fetchNotifications()
		.then(resp => {
			// no content
			if(resp.status === 502 || resp.status === 204) {
				return []
			}
			
			return resp.json()
		})
		.then(data => {
			_state.notifications = data
		}))

		Promise.allSettled(promiseArr)
		.then(values => {
			console.log(_state)
			_state.isLoading = false
			setState(_state)
		})
	}, [])

	const deleteNotification = (id) => {
		let notification = state.notifications.find(notif => {
			return notif.id === id
		})

		if (notification) {
			fetchNotificationDelete(id)
			.then(resp => {
				// no content
				if(resp.status === 200 && mounted.current) {
					removeNotification(id)
				}
			})
		}
	}

	const removeNotification = (id) => {
		const notifs = state.notifications.filter((item) => {return item.id !== id})
		setState({...state, notifications: notifs})
	}

	return (
		<header className={cn} >
			{ state.isGuest
				? <span id="current-user" data-logged-in="false"></span>
				: <span id="current-user"
						data-logged-in="true"
						data-name={`${state.userFirst} ${state.userLast}`}
						data-avatar={state.userAvatar}
						data-role={userRoles.includes('author') ? 'Staff' : 'Student'}
						data-notify={userNotify}
					></span>
			}

			<h1 className="logo"><a href="/">Materia</a></h1>

			{	!state.isLoading
				?	<span>
						<p className="user avatar">
							{ state.loggedIn
								? <a href="/profile">
										<span>{`${state.userFirst} ${state.userLast}`}</span>
										<img src={state.userAvatar} />
									</a>
								: null
							}
							{ state.loggedIn
								? <span className="logout">
										<a href="/users/logout">Logout</a>
									</span>
								: null
							}

							{ allowLogins && ! state.loggedIn
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
					{ state.loggedIn
						? <li>
							<a href="/profile">My Profile</a>
							</li>
						: null
					}
					<li><a href="/help">Help</a></li>

					{ state.isAdmin
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

					{ state.isSupport
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

					{ state.loggedIn
						? <li>
								<span className="logout">
									<a href="/users/logout">Logout</a>
								</span>
							</li>
						: null
					}

				</ul>
			</nav>

			{ state.loggedIn && state.notifications.length
				? <>
					<a
						id="notifications_link"
						data-notifications={state.notifications.length}
						onClick={ () => { setNavOpen(!navOpen) } }
					></a>
					<div id="notices" className={navOpen ? 'open' : ''}>
						{ state.notifications.map(notification => (
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
									onClick={() => {deleteNotification(notification.id)}}
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
