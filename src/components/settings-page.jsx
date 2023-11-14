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
		onError: (err) => {
			if (err.message == "Invalid Login") {
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
			setState({...state, notify: currentUser.profile_fields.notify, useGravatar: currentUser.profile_fields.useGravatar})
			return () => (mounted.current = false)
		}
	},[isFetching])

	const [state, setState] = useState({notify: false, useGravatar: false})

	const mutateUserSettings = useUpdateUserSettings()

	const _updateEmailPref = event => {
		setState({...state, notify: !state.notify})

	}

	const _updateIconPref = pref => {
		setState({...state, useGravatar: pref})
	}

	const _submitSettings = () => {
		mutateUserSettings.mutate({
			notify: state.notify,
			useGravatar: state.useGravatar,
			successFunc: () => {},
			errorFunc: (err) => {
				if (err.message == "Invalid Login") {
					setAlertDialog({
						enabled: true,
						message: 'You must be logged in to view your settings.',
						title: 'Login Required',
						fatal: true,
						enableLoginButton: true
					})
				} else if (err.message == "Unauthorized") {
					setAlertDialog({
						enabled: true,
						message: 'You do not have permission to view this page.',
						title: 'Action Failed',
						fatal: err.halt,
						enableLoginButton: false
					})
				}
				setError("Error updating settings.")
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
		mainContentRender =
			<section className='page settings'>
				<ul className='main_navigation'>
					<li className='profile'><a href='/profile'>Profile</a></li>
					<li className='selected settings'><a href='/settings'>Settings</a></li>
				</ul>

				<div className='avatar_big'>
					<img src={currentUser.avatar} />
				</div>

				<h2>
					<span>Settings</span>
					{`${currentUser.first} ${currentUser.last}`}
				</h2>

				<span>Notifications</span>
				<ul>
					<li>
						<input type='checkbox' id='notify' name='notify' checked={state.notify == true} onChange={_updateEmailPref} />
						<label>Send me an email when a widget has been shared with me.</label>
						<br/>
						<p className='email_exp'>Email notifications will be sent to {currentUser.email}.</p>
					</li>
				</ul>
				<span>User Icon</span>
				<ul>
					<li>
						<input type="radio" name="avatar" id="avatar_gravatar" checked={state.useGravatar == true} onChange={() => _updateIconPref(true)}/>
						<label>Use Gravatar</label>
						<a className="external tiny" href="https://en.gravatar.com/" target="_blank">(Upload or change your icon at gravatar.com)</a>
					</li>
					<li>
						<input type="radio" name="avatar" id="avatar_default" checked={state.useGravatar == false} onChange={() => _updateIconPref(false)} />
						<label>None</label>
					</li>
				</ul>

				{ errorRender }

				<button type="submit" className="action_button" onClick={_submitSettings}>Save</button>

			</section>
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
