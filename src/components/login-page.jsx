import React, { useEffect, useRef, useState } from 'react'
import Header from './header'
import './login-page.scss'

const LoginPage = () => {

	const mounted = useRef(false)
	const [state, setState] = useState({
		loginUser: '',
		loginPw: '',
		actionLogin: '',
		actionRedirect: '',
		bypass: false,
		loginLinks: '',
		errContent: '',
		noticeContent: ''
	})

	useEffect(() => {
		waitForWindow()
		.then(() => {
			console.log('server vals received')

			let links = decodeURIComponent(window.LOGIN_LINKS).split('@@@').map((link, index) => {
				let vals = link.split('***')
				return <li key={index}><a href={`${vals[0]}`}>{`${vals[1]?.replace('+',' ')}`}</a></li>
			})

			setState({
				loginUser: window.LOGIN_USER,
				loginPw: window.LOGIN_PW,
				actionLogin: window.ACTION_LOGIN,
				actionRedirect: window.ACTION_REDIRECT,
				bypass: window.BYPASS,
				loginLinks: links,
				errContent: window.ERR_LOGIN != undefined ? <div className='error'><p>{`${window.ERR_LOGIN}`}</p></div> : '',
				noticeContent: window.NOTICE_LOGIN != undefined ? <div className='error'><p>{`${window.NOTICE_LOGIN}`}</p></div> : ''
			})
		})
	}, [])

	const waitForWindow = async () => {
		while(!window.hasOwnProperty('LOGIN_USER')
		&& !window.hasOwnProperty('LOGIN_PW')
		&& !window.hasOwnProperty('ACTION_LOGIN')
		&& !window.hasOwnProperty('ACTION_REDIRECT')
		&& !window.hasOwnProperty('BYPASS')
		&& !window.hasOwnProperty('LOGIN_LINKS')) {
			await new Promise(resolve => setTimeout(resolve, 500))
		}
	}

	const onInputChange = (input) => {
	}

	return (
		<>
			<Header />
			<div className="container">
				<section className="page">
					<div className="detail">
						<h2 className="logo">Log In to Your Account</h2>
						<span className="subtitle">{`Using your ${state.loginUser} and ${state.loginPw} to access your Widgets.`}</span>
					</div>

					<div id="form">
						{ state.errContent }
						{ state.noticeContent }
						<form method="post" action={`${state.actionLogin}?redirect=${state.actionRedirect}`} className='form-content'>
							<ul>
								<li>
									<input type="text" name="username" id="username" placeholder={state.loginUser} tabIndex="1" autoComplete="username" />
								</li>
								<li>
									<input type="password" name="password" id="password" placeholder={state.loginPw} tabIndex="2" autoComplete="current-password" />
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
				</section>
			</div>
		</>
	)
}

export default LoginPage
