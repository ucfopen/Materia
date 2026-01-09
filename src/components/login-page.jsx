import React, { useEffect, useRef, useState } from 'react'
import { apiLoginDirect } from '../util/api'
import { waitForWindow } from '../util/wait-for-window'

import Header from './header'
import Summary from './widget-summary'
import LoginSubtitle from 'MateriaText/login/login-subtitle.mdx'
import LoginHelp from 'MateriaText/login/login-help.mdx'
import EmbedFooter from './widget-embed-footer'

import Common from 'MateriaCommon'
import './login-page.scss'

const LoginPage = () => {
	const [state, setState] = useState({
		actionRedirect: '/profile/',
		redirectActive: false,
		externalLogin: '',
		errContent: '',
		noticeContent: '',
		context: 'login',
	})

	useEffect(() => {
		waitForWindow(['BASE_URL', 'WIDGET_URL', 'STATIC_CROSSDOMAIN'])
		.then(() => {

			const params = new URLSearchParams(window.location.search)
			let actionRedirect = params.get('next') ?? ''
			actionRedirect += (window.location.hash ? window.location.hash : '')
			const directLogin = params.get('directlogin') | ''

			setState({
				actionRedirect: actionRedirect.length > 0 ? actionRedirect : window.ACTION_REDIRECT,
				is_embedded: window.IS_EMBEDDED ?? false,
				externalLogin: window.EXTERNAL_LOGIN_URL ?? '',
				redirectActive: window.AUTH_REDIRECT_ACTIVE ?? false,
				context: window.CONTEXT,
				instName: window.NAME != undefined ? window.INST_NAME : null,
				widgetName: window.WIDGET_NAME != undefined ? window.WIDGET_NAME : null,
				isPreview: window.IS_PREVIEW != undefined ? window.IS_PREVIEW : null,
				errContent: window.ERR_LOGIN ? window.ERR_LOGIN : null,
				noticeContent: window.NOTICE_LOGIN ?? null,
				restrictedToLMS: window.LOGINS_RESTRICTED_TO_LMS ?? false,
				directLogin: !!directLogin

			})
		})
	}, [])

	const handleLogin = (e) => {
		e.preventDefault()
		const username = document.getElementById('username').value
		const password = document.getElementById('password').value

		apiLoginDirect(username, password).then((res) => {
			window.location.href = state.actionRedirect
		}).catch((e) => {
			let errorMsg = 'Authentication failed due to an error.'
			if (e.data?.isAuthenticated == false) {
				errorMsg = 'Invalid login.'
			}
			setState(prevState => ({
				...prevState,
				errContent: errorMsg,
			}))
		})
	}

	const handleInputChange = (e) => {
		const { name, value } = e.target
		setState(prevState => ({
			...prevState,
			[name]: value
		}))
	}

	let detailContent = <></>
	if (!state.context || state.context == 'login') {
		detailContent =
		<div className="login_context detail">
			<h2 className="context-header">Login to Your Account</h2>
			{ !!state.externalLogin ? '' : <LoginSubtitle /> }
		</div>
	} else if (state.context && state.context == 'widget') {
		detailContent =
		<div className="login_context detail">
			<h2 className="context-header">Login to play this widget</h2>
			{ !!state.externalLogin ? '' : <LoginSubtitle /> }
		</div>
	}

	let errContent = null
	if ( !!state.errContent) {
		errContent = <div role="alert" className="login-error">{state.errContent}</div>
	}

	let noticeContent = null
	if ( !!state.noticeContent) {
		noticeContent = <div role="alert" className="login-notice">{state.noticeContent}</div>
	}

	let loginContent = null
	if ( (!state.restrictedToLMS && !state.redirectActive) || state.directLogin) {
		loginContent = (
			<div id="form">
				<form onSubmit={handleLogin} className='form-content'>
					<ul>
						<li>
							<input type="text" name="username" id="username" placeholder={Common.loginUsernameText} tabIndex="1" autoComplete="username" onChange={handleInputChange}/>
						</li>
						<li>
							<input type="password" name="password" id="password" placeholder={Common.loginPasswordText} tabIndex="2" autoComplete="current-password" onChange={handleInputChange}/>
						</li>
						<li className="submit_button">
							<button type="submit" tabIndex="3" className="action_button">Login</button>
						</li>
					</ul>
				</form>
			</div>
		)
	} else if (state.restrictedToLMS) {
		loginContent = (
			<div className='external-auth-link'>
				<a className="action_button" href={state.externalLogin}>External Login</a>
			</div>
		)
	} else if (state.redirectActive) {
		const loginPath = `${window.BASE_URL}login?next=${state.actionRedirect}`
		loginContent = (
			<div className='external-auth-link'>
				<a className="action_button" href={loginPath}>External Login</a>
			</div>
		)
	}

	return (
		<>
			{ state.is_embedded ? '' : <Header /> }
			<div className="container">
				<section className="page">
					{ state.context && state.context == 'widget' ? <Summary /> : ''}
					{ detailContent }

					{ errContent }
					{ noticeContent }
					
					{ loginContent }
					{ state.context != 'widget' ? <LoginHelp /> : '' }
					{ state.context && state.context == 'widget' ? <EmbedFooter /> : ''}
				</section>
			</div>
		</>
	)
}

export default LoginPage
