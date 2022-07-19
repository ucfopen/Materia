import React from 'react'
import Header from './header'

const HelpPage = () => {
	return (
		<>
			<Header />
			<div className="container">
				<section className="page">
					<h1>Help &amp; Support</h1>
					<section className="bordered">
						<h2 id="getting-started-link">Getting Started</h2>
						<p>Check out the <a href="https://cdl.ucf.edu/support/materia/materia-quick-start-guide/" className="external">Materia Quickstart Guide</a>.</p>
					</section>

					<section className="bordered">
						<h2 id="flash-required">Requirements</h2>
						<p className="flash-version">Materia requires that you use an up-to-date browser with javascript and cookies enabled.</p>
					</section>

					<section className="float left">
						<h2 id="login-issues">Login Issues</h2>
						<p>In many cases, problems logging in are a result of one of the following:</p>

						<h3>Incorrect Password</h3>
						<p>You may need to reset your password.</p>

						<h3>Expired Password</h3>
						<p>You may need to reset your password.</p>

						<h3>User Account Doesn't exist</h3>
						<p>Your user account may not have been created yet.</p>
					</section>

					<section className="float right bordered">
						<h2 id="faq-link">Documentation</h2>
						<p><a href="https://ucfopen.github.io/Materia-Docs/">View the docs</a> for guides on using Materia.</p>
						<h3 id="faq-link">Getting Started</h3>
						<p><a href="https://ucfopen.github.io/Materia-Docs/play/getting-started.html">Player/Student Guide</a></p>
						<p><a href="https://ucfopen.github.io/Materia-Docs/create/getting-started.html">Author/Instructor Guide</a></p>
					</section>

					<section className="float right">
						<h2 id="support">Support</h2>
						<p>If you need help beyond what has been provided here, please contact support using one of the following:</p>
						<dl>
							<dt>Support</dt>
								<dd><a href="http://website/support">http://website/support/</a></dd>
							<dt>Email</dt>
								<dd><a href="mailto:support@website">support@website</a></dd>
							<dt>Phone</dt>
								<dd>PHONE NUMBER HERE</dd>
						</dl>
					</section>
				</section>
			</div>
		</>
	)
}

export default HelpPage
