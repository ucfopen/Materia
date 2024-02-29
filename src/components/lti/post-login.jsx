import React, { useState, useEffect } from 'react'

const PostLogin = () => {
	const [staticURL, setStaticURL] = useState('')

	useEffect(() => {
		waitForWindow().then(() => {
			setStaticURL(window.STATIC_CROSSDOMAIN)
		})
	}, [])

	const waitForWindow = async () => {
		while (!window.hasOwnProperty('STATIC_CROSSDOMAIN')) {
			await new Promise(resolve => setTimeout(resolve, 500))
		}
	}

	return (
		<section id="lti-login-section">
		<header id="h1-div">
			<h1>
				Materia: Enhance Your Course with Widgets
			</h1>
		</header>
		<section className="content">
			<div>
				<img src={staticURL + "img/materia-post-login-banner-1.svg"}/>
				<p>
					<span className='subheader'>Browse the Widget Catalog</span>
					Peruse our catalog for a widget applicable to your course content. Some widgets are specialized for
					particular disciplines, while others can be applied to just about any subject matter.
				</p>
			</div>
			<div>
				<img src={staticURL + "img/materia-post-login-banner-2.svg"}/>
				<p>
					<span className='subheader'>Build Your Widget</span>
					Every widget includes a powerful creator interface to customize it to suit your needs, no technical expertise required.
					Most widgets can be authored in just minutes.
				</p>
			</div>
			<div>
				<img src={staticURL + "img/materia-post-login-banner-3.svg"}/>
				<p><span className='subheader'>Share With Your Students</span>
				Widgets can be shared directly or embedded as an assignment in your LMS. When set up as an external tool in an assignment, scores
				will be automatically sent to the gradebook.
				</p>
			</div>
			<div className='action_buttons'>
				<a className="action_button" target='_blank' href="/my-widgets">Go to Materia</a>
				<a className="action_button" target='_blank' href="http://ucfopen.github.io/Materia-Docs/create/embedding-in-canvas.html">Learn More</a>
			</div>
		</section>
	</section>
	)
}

export default PostLogin
