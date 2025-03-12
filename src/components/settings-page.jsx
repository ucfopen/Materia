import React, { useState, useRef, useEffect } from 'react'
import { useQuery } from 'react-query'
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
	const { data: currentUser, isFetching} = useQuery({
		queryKey: 'user',
		queryFn: apiGetUser,
		staleTime: Infinity,
		retry: false,
		onError: (err) => {
			if (err.message == 'Invalid Login') {
				setAlertDialog({
					enabled: true,
					message: 'You must be logged in to view your settings.',
					title: 'Login Required',
					fatal: true,
					enableLoginButton: true
				})
			}
		}
	})

	useEffect(() => {
		if (mounted && ! isFetching && currentUser) {
			mounted.current = true
			setState({...state, notify: currentUser.profile_fields.notify, useGravatar: currentUser.profile_fields.useGravatar, darkMode: currentUser.profile_fields.darkMode ? currentUser.profile_fields.darkMode : false})
			return () => (mounted.current = false)
		}
	},[isFetching])

	const [state, setState] = useState({notify: false, useGravatar: false, darkMode: false})

	const mutateUserSettings = useUpdateUserSettings()

	const _updateEmailPref = event => {
		setState({...state, notify: !state.notify})

	}

	const _updateIconPref = pref => {
		setState({...state, useGravatar: pref})
	}

	const _updateDarkModePref = event => {
		setState({...state, darkMode: !state.darkMode});
	}

	const _submitSettings = () => {
		mutateUserSettings.mutate({
			notify: state.notify,
			useGravatar: state.useGravatar,
			darkMode: state.darkMode,
			successFunc: () => {
				// immediately apply/revoke darkmode to body tag. This will be automatically applied
				// on subsequent page views across the application
				if (state.darkMode) document.body.classList.add('darkMode')
				else document.body.classList.remove('darkMode')
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

	let mainContentRender = <section className='page'><div className='loading-icon-holder'><LoadingIcon /></div></section>
	if ( !isFetching && currentUser ) {
		mainContentRender = (
			<section className="page settings">
				<ul className="main_navigation">
					<div className="avatar_big">
						<img src={currentUser.avatar} />
					</div>
					<ul>
						<li className="profile">
							<a href="/profile">Profile</a>
						</li>
						<li className="selected settings">
							<a href="/settings">Settings</a>
						</li>
					</ul>
				</ul>

				<div className="settings_content">
					<h2>
						<span>Settings</span>
						{`${currentUser.first} ${currentUser.last}`}
					</h2>

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
								<span className="custom-checkbox"></span>
								Send me an email when a widget has been shared with me.
							</label>
							<p className="exp">
								Email notifications will be sent to{' '}
								<span className="email_exp_addr">{currentUser.email}</span>.
							</p>
						</li>
					</ul>
					<span>User Icon</span>
					<ul>
						<li>
							<label className="radio-wrapper">
								<input
									type="radio"
									name="avatar"
									id="avatar_gravatar"
									checked={state.useGravatar == true}
									onChange={() => _updateIconPref(true)}
								/>
								<span className="custom-radio"></span>
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
								<span className="custom-radio"></span>
								None
							</label>
						</li>
					</ul>
					<span>Dark Mode</span>
					<ul>
						<li>
							<label className="checkbox-wrapper">
								<input
									type="checkbox"
									id="darkMode"
									name="darkMode"
									checked={state.darkMode == true}
									onChange={_updateDarkModePref}
								/>
								<span className="custom-checkbox"></span>
								Use Dark Mode
							</label>
							<p className="exp">Note: This does not influence widgets.</p>
						</li>
					</ul>
				</div>

				{errorRender}

				<button type="submit" className="action_button" onClick={_submitSettings}>
					Save
				</button>
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
