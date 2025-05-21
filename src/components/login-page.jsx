import React, { useEffect, useRef, useState } from 'react'
import { apiLoginDirect } from '../util/api'

import Header from './header'
import Summary from './widget-summary'
import LoginSubtitle from 'MateriaText/login/login-subtitle.mdx'
import EmbedFooter from './widget-embed-footer'

import Common from 'MateriaCommon'
import './login-page.scss'

const LoginPage = () => {
	const [state, setState] = useState({
		actionLogin: '',
		actionRedirect: '/profile/',
		bypass: false,
		loginLinks: '',
		errContent: '',
		noticeContent: '',
		context: 'login',
	})

	const waitForWindow = async () => {
		while(!window.hasOwnProperty('ACTION_LOGIN')
		&& !window.hasOwnProperty('ACTION_REDIRECT')
		&& !window.hasOwnProperty('BYPASS')
		&& !window.hasOwnProperty('LOGIN_LINKS')
		&& !window.hasOwnProperty('CONTEXT')) {
			await new Promise(resolve => setTimeout(resolve, 500))
		}
	}

	useEffect(() => {
		waitForWindow()
		.then(() => {
			let links = decodeURIComponent(window.LOGIN_LINKS).split('@@@').map((link, index) => {
				let vals = link.split('***')
				return <li key={index}><a href={`${vals[0]}`}>{`${vals[1]?.replace('+',' ')}`}</a></li>
			})

			let actionRedirect = window.location.search && window.location.search.split("?next=").length > 1 ? window.location.search.split("?next=")[1] : ''
			actionRedirect += (window.location.hash ? window.location.hash : '')

			setState({
				actionLogin: window.ACTION_LOGIN,
				actionRedirect: actionRedirect.length > 0 ? actionRedirect : window.ACTION_REDIRECT,
				is_embedded: window.EMBEDDED != undefined ? window.EMBEDDED : false,
				bypass: window.BYPASS,
				context: window.CONTEXT,
				instName: window.NAME != undefined ? window.INST_NAME : null,
				widgetName: window.WIDGET_NAME != undefined ? window.WIDGET_NAME : null,
				isPreview: window.IS_PREVIEW != undefined ? window.IS_PREVIEW : null,
				loginLinks: links,
				errContent: window.ERR_LOGIN ?? null,
				noticeContent: window.NOTICE_LOGIN ?? null
			})
		})
	}, [])


	let detailContent = <></>
	if (!state.context || state.context == 'login') {
		detailContent =
		<div className="login_context detail">
			<h2 className="context-header">Log In to Your Account</h2>
			<LoginSubtitle />
		</div>
	} else if (state.context && state.context == 'widget') {
		detailContent =
		<div className="login_context detail">
			<h2 className="context-header">Log in to play this widget</h2>
			<LoginSubtitle />
		</div>
	}

	const handleLogin = (e) => {
		e.preventDefault()
		const username = document.getElementById('username').value
		const password = document.getElementById('password').value

		apiLoginDirect(username, password).then((res) => {
			const params = new URLSearchParams(window.location.search)
			window.location.href = params.get('next') ?? '/profile/'
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

	let errContent = null
	if ( !!state.errContent) {
		errContent = <div role="alert" className="login-error">{state.errContent}</div>
	}

	let noticeContent = null
	if ( !!state.noticeContent) {
		noticeContent = <div role="alert" className="login-notice">{state.noticeContent}</div>
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
							{ state.bypass ?
								<ul className="help_links">
									{ state.loginLinks }
									<li><a href="/help">Help</a></li>
								</ul>
							: '' }
						</form>
					</div>
					{ state.context && state.context == 'widget' ? <EmbedFooter /> : ''}
				</section>
			</div>
		</>
	)
}

export default LoginPage
