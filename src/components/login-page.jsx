import React, { useEffect, useRef, useState } from 'react'
import Header from './header'
import Summary from './widget-summary'
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
			let links = decodeURIComponent(window.LOGIN_LINKS).split('@@@').map((link, index) => {
				let vals = link.split('***')
				return <li key={index}><a href={`${vals[0]}`}>{`${vals[1]?.replace('+',' ')}`}</a></li>
			})

			setState({
				loginUser: window.LOGIN_USER,
				loginPw: window.LOGIN_PW,
				actionLogin: window.ACTION_LOGIN,
				actionRedirect: window.ACTION_REDIRECT,
				is_embedded: window.EMBEDDED != undefined ? window.EMBEDDED : false,
				bypass: window.BYPASS,
				context: window.CONTEXT,
				instName: window.NAME != undefined ? window.INST_NAME : null,
				widgetName: window.WIDGET_NAME != undefined ? window.WIDGET_NAME : null,
				isPreview: window.IS_PREVIEW != undefined ? window.IS_PREVIEW : null,
				iconURL: window.ICON != undefined ? window.ICON_URL : null,
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
		&& !window.hasOwnProperty('LOGIN_LINKS')
		&& !window.hasOwnProperty('CONTEXT')) {
			await new Promise(resolve => setTimeout(resolve, 500))
		}
	}

	const onInputChange = (input) => {
	}

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
