import React, { useEffect, useRef, useState } from 'react'
import Header from './header'
import Summary from './widget-summary'
import './login-page.scss'
import EmbedFooter from './widget-embed-footer'

const LoginPage = () => {

	const mounted = useRef(false)
	const [state, setState] = useState({
		loginUser: '',
		loginPw: '',
		actionLogin: '',
		actionRedirect: '/profile/',
		bypass: false,
		loginLinks: '',
		errContent: '',
		noticeContent: '',
		errContent: '',
		context: 'login',
	})

	useEffect(() => {
		const storedUsername = localStorage.getItem('username') || ''
		const storedRedirect = sessionStorage.getItem('redirect') || '/profile/'

		setState(prevState => ({
			...prevState,
			loginUser: storedUsername,
			actionRedirect: storedRedirect,
		}))
	}, [])


	let detailContent = <></>
	if (!state.context || state.context == 'login') {
		detailContent =
		<div className="login_context detail">
			<h2 className="context-header">Log In to Your Account</h2>
			<span className="subtitle">{`Using your ${state.loginUser} and ${state.loginPw} to access your Widgets.`}</span>
		</div>
	} else if (state.context && state.context == 'widget') {
		detailContent =
		<div className="login_context detail">
			<h2 className="context-header">Log in to play this widget</h2>
			<span className="subtitle">{`Using your ${state.loginUser} and ${state.loginPw} to access your Widgets.`}</span>
		</div>
	}

	const getCSRFToken = () => {
		const cookies = document.cookie.split(';')
		for(let cookie of cookies) {
			if(cookie.startsWith('csrftoken=')) {
				return cookie.split('=')[1]
			}
		}
		return ''
	}

	const handleLogin = async (e) => {
		e.preventDefault()
		const username = document.getElementById('username').value
		const password = document.getElementById('password').value
		const csrfToken = getCSRFToken()
		const response = await fetch('/api/json/auth/login/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrfToken,
			},
			// body: JSON.stringify({
			// 	username: state.loginUser,
			// 	password: state.loginPw,
			// }),
			body: JSON.stringify({ username, password }),
		})

		const data = await response.json()
		if (response.ok) {
			localStorage.setItem('username', state.loginUser)
			window.location.href = state.actionRedirect
		} else {
			setState(prevState => ({
				...prevState,
				errContent: data.error,
			}))
		}
	}

	const handleInputChange = (e) => {
		const { name, value } = e.target
		setState(prevState => ({
			...prevState,
			[name]: value
		}))
	}

	return (
		<>
			{ state.is_embedded ? '' : <Header /> }
			<div className="container">
				<section className="page">
					{ state.context && state.context == 'widget' ? <Summary /> : ''}
					{ detailContent }

					<div id="form">
						{ state.errContent }
						{ state.noticeContent }
						<form onSubmit={handleLogin} className='form-content'>
							<ul>
								<li>
									<input type="text" name="username" id="username" placeholder={state.loginUser} tabIndex="1" autoComplete="username" onChange={handleInputChange}/>
								</li>
								<li>
									<input type="password" name="password" id="password" placeholder={state.loginPw} tabIndex="2" autoComplete="current-password" onChange={handleInputChange}/>
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
