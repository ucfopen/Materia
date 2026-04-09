import React, { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import LoadingIcon from './loading-icon'
import {apiGetUser} from '../util/api'
import useUpdateUserSettings from './hooks/useUpdateUserSettings'
import Header from './header'
import './profile-page.scss'
import Alert from './alert'

const SettingsPage = () => {
	const [alertDialog, setAlertDialog] = useState({
		enabled: false,
		message: '',
		title: 'Failure',
		fatal: false,
		enableLoginButton: false
	})
	const [error, setError] = useState('')
	const mounted = useRef(false)

	const [state, setState] = useState({
		notify: false,
		useGravatar: false,
		theme: 'light'
	})

	const { data: currentUser, isFetching, isError: currentUserError } = useQuery({
		queryKey: ['user', 'me'],
		queryFn: ({ queryKey }) => {
			const [_key, user] = queryKey
			return apiGetUser(user)
		},
		staleTime: Infinity,
		retry: false
	})

	useEffect(() => {
		if (currentUserError) {
			setAlertDialog({
				enabled: true,
				message: 'You must be logged in to view your settings.',
				title: 'Login Required',
				fatal: true,
				enableLoginButton: true
			})
		}
	}, [currentUserError])

	useEffect(() => {
		if (mounted && ! isFetching && currentUser) {
			mounted.current = true
			setState({
				notify: currentUser.profile_fields.notify,
				useGravatar: currentUser.profile_fields.useGravatar,
				theme: currentUser.profile_fields.theme
			})
		}
		return () => {
			mounted.current = false
		}
	},[isFetching])

	const mutateUserSettings = useUpdateUserSettings()

	const _updateEmailPref = event => {
		setState({...state, notify: !state.notify})

	}

	const _updateIconPref = pref => {
		setState({...state, useGravatar: pref})
	}

	const _updateThemePref = (e) => {
		const newTheme = e.target.value
		setState(prev => ({ ...prev, theme: newTheme }))
		window.theme = newTheme
	}

	const _submitSettings = () => {
		mutateUserSettings.mutate({
			user_id: currentUser.id,
			profile_fields: {
				notify: state.notify,
				useGravatar: state.useGravatar,
				theme: state.theme
			},
			successFunc: () => {
				// Immediately apply/revoke theme to body
				if (state.theme === 'dark') {
					document.body.classList.add('darkMode')
				} else if (state.theme === 'light') {
					document.body.classList.remove('darkMode')
				} else if (state.theme === 'os') {
					const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
					if (prefersDark) {
						document.body.classList.add('darkMode')
					} else {
						document.body.classList.remove('darkMode')
					}
				}
			},
			errorFunc: (err) => {
				if (err.message == 'Invalid Login') {
					setAlertDialog({
						enabled: true,
						message: 'You must be logged in to view your settings.',
						title: 'Login Required',
						fatal: true,
						enableLoginButton: true
					})
				} else if (err.message == 'Unauthorized') {
					setAlertDialog({
						enabled: true,
						message: 'You do not have permission to view this page.',
						title: 'Action Failed',
						fatal: err.halt,
						enableLoginButton: false
					})
				}
				setError((err.message || 'Error') + ': Failed to update settings.')
			}
		})
	}

	let errorRender = null
	if (error) {
		errorRender = (
			<div className='error'><p>{error}</p></div>
		)
	}

	let alertDialogRender = null
	if (alertDialog.enabled) {
		alertDialogRender = (
			<Alert
				msg={alertDialog.message}
				title={alertDialog.title}
				fatal={alertDialog.fatal}
				showLoginButton={alertDialog.enableLoginButton}
				onCloseCallback={() => {
					setAlertDialog({...alertDialog, enabled: false})
				}} />
		)
	}

	let mainContentRender = <section className='page loading'><div className='loading-icon-holder'><LoadingIcon /></div></section>
	if ( !isFetching && currentUser ) {
		mainContentRender = (
			<section className="page settings">
				<ul className="main_navigation" role="menu">
					<div className="avatar_big">
						<img src={currentUser.avatar} />
					</div>
					<ul>
						<li className="profile">
							<a href="/profile" role="menuitem">Profile</a>
						</li>
						<li className="selected_settings">
							<a href="/settings" role="menuitem">Settings</a>
						</li>
					</ul>
				</ul>

				<div className="settings_content">
					<header>
						<span>Settings</span>
						<h2>
							{`${currentUser.first_name} ${currentUser.last_name}`}
						</h2>
					</header>
					<span>Notifications</span>
					<ul>
						<li>
							<label className="checkbox-wrapper">
								<input
									type="checkbox"
									id="notify"
									name="notify"
									checked={state.notify == true}
									onChange={_updateEmailPref}
								/>
								<span className="custom-checkbox" role="checkbox" aria-checked={state.notify == true}></span>
								Send me an email when a widget has been shared with me.
							</label>
							<p className="exp">
								Email notifications will be sent to{' '}
								<span className="email_exp_addr">{currentUser.email}</span>.
							</p>
						</li>
					</ul>
					<span>User Icon</span>
					<ul className='user-icon-select' role="radiogroup">
						<li>
							<label className="radio-wrapper">
								<input
									type="radio"
									name="avatar"
									id="avatar_gravatar"
									checked={state.useGravatar == true}
									onChange={() => _updateIconPref(true)}
								/>
								<span className="custom-radio" role="radio" aria-checked={state.useGravatar == true}></span>
								Use Gravatar
							</label>
							<a className="external tiny" href="https://en.gravatar.com/" target="_blank">
								{' '}
								(Upload or change your icon at gravatar.com)
							</a>
						</li>
						<li>
							<label className="radio-wrapper">
								<input
									type="radio"
									name="avatar"
									id="avatar_default"
									checked={state.useGravatar == false}
									onChange={() => _updateIconPref(false)}
								/>
								<span className="custom-radio" role="radio" aria-checked={state.useGravatar == false}></span>
								None
							</label>
						</li>
					</ul>
					<span>Theme</span>
					<ul className="theme-select" role="radiogroup">
						<li>
							<label className="radio-wrapper">
								<input
									type="radio"
									name="theme"
									value="dark"
									checked={state.theme === "dark"}
									onChange={_updateThemePref}
								/>
								<span className="custom-radio" role="radio" aria-checked={state.theme === "dark"}></span>
								Dark
							</label>
						</li>

						<li>
							<label className="radio-wrapper">
								<input
									type="radio"
									name="theme"
									value="light"
									checked={state.theme === "light"}
									onChange={_updateThemePref}
								/>
								<span className="custom-radio" role="radio" aria-checked={state.theme === "light"}></span>
								Light
							</label>
						</li>

						<li>
							<label className="radio-wrapper">
								<input
									type="radio"
									name="theme"
									value="os"
									checked={state.theme === "os"}
									onChange={_updateThemePref}
								/>
								<span className="custom-radio" role="radio" aria-checked={state.theme === "os"}></span>
								System Preference
							</label>
							<p className="exp">Note: This does not influence widgets.</p>
						</li>
					</ul>
					<button type="submit" className="action_button" onClick={_submitSettings}>
					Save
					</button>
				</div>

				{errorRender}
			</section>
		)
	}

	return (
		<>
			<Header />
			{ alertDialogRender }
			<div className='profile-page'>
				<div className='settings'>
					{ mainContentRender }
				</div>
			</div>
		</>
	)
}

export default SettingsPage
