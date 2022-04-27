import React, { useState, useRef, useEffect } from 'react'
import { useQuery } from 'react-query'
import LoadingIcon from './loading-icon'
import {apiGetUser} from '../util/api'
import useUpdateUserSettings from './hooks/useUpdateUserSettings'
import Header from './header'
import './profile-page.scss'

const SettingsPage = () => {

	const mounted = useRef(false)
	const { data: currentUser, isFetching} = useQuery({
		queryKey: 'user',
		queryFn: apiGetUser,
		staleTime: Infinity
	})
	
	useEffect(() => {
		if (mounted && ! isFetching) {
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
			useGravatar: state.useGravatar
		})
	}

	let mainContentRender = <section className='page'><div className='loading-icon-holder'><LoadingIcon /></div></section>
	if ( !isFetching ) {
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
					<span>Account</span>
					Settings
				</h2>

				<h3>Notifications</h3>
				<ul>
					<li>
						<input type='checkbox' id='notify' name='notify' checked={state.notify == true} onChange={_updateEmailPref} />
						<label>Send me an email when a widget has been shared with me.</label>
						<br/>
						<p className='email_exp'>Email notifications will be sent to <span className='email_exp_addr'>{currentUser.email}</span>.</p>
					</li>
				</ul>
				<h3>User Icon</h3>
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

				<button type="submit" className="action_button" onClick={_submitSettings}>Save</button>

			</section>
	}

	return (
		<>
			<Header />
			<div className='profile-page'>
				<div className='settings'>
					{ mainContentRender }
				</div>
			</div>
		</>
	)
}

export default SettingsPage