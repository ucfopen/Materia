import React from 'react';

const HelpHome = () => {

	return (
		<>
			<section className="full-width">
				<h2 id="faq-link">Getting Started</h2>
				<p>Having issues with Materia or don't know where to get started? We're here to help. For first-time users, get more information about Materia from the links below.</p>
				<p><a href="https://ucfopen.github.io/Materia-Docs/play/getting-started.html">Player/Student Guide</a></p>
				<p><a href="https://ucfopen.github.io/Materia-Docs/create/getting-started.html">Author/Instructor Guide</a></p>
			</section>
			<section className="full-width">
				<h2 id="flash-required">Requirements</h2>
				<p className="flash-version">Materia requires that you use an up-to-date browser with javascript and cookies enabled.</p>
			</section>

			<section className="half-width">
				<h2 id="login-issues">Login Issues</h2>
				<p>In many cases, problems logging in are a result of one of the following:</p>

				<h3>Incorrect Password</h3>
				<p>You may need to reset your password.</p>

				<h3>Expired Password</h3>
				<p>You may need to reset your password.</p>

				<h3>User Account Doesn't exist</h3>
				<p>Your user account may not have been created yet.</p>
			</section>

			<section className="half-width">
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
			<section className='full-width'>
				<h2 id="faq-link">Documentation</h2>
				<p><a href="https://ucfopen.github.io/Materia-Docs/">Our docs site</a> has extensive documentation for students, authors, support users, and developers.</p>
			</section>
		</>
	)
}

export default HelpHome
