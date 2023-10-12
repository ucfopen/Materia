import React from 'react';

const HelpForStudents = () => {

	return (
		<>
			<section className='half-width'>
				<h2>For Students</h2>
				<p>
					Materia is an open-source educational platform hosted alongside your LMS to enhance course content with interactive tools
					called <span className='italic'>widgets. </span> If you run into a problem playing a widget or receiving a score, we're here to help.
				</p>
			</section>
			<section className="half-width">
				<h2 id="support">Get Support</h2>
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
				<h2>Common Questions &amp; Issues</h2>
				<dl>
					<dt>I'm not seeing a widget, only an error message. What do I do?</dt>
					<dd>
						<p>For one reason or a another Materia encountered a server issue or an issue authenticating you. Contact support using the info above.</p>
					</dd>
					<dt>I completed a widget, but my grade didn't update. What happened?</dt>
					<dd>
						<p>Widgets should automatically update the gradebook with your score when embedded correctly in an assignment. If a widget is embedded as a module item or directly in a regular course page,
						the gradebook sync will <span className='italic'>not</span> occur. Additionally, ensure you have advanced the widget all the way to the score screen,
						which is when the play session is formally concluded. Leaving the play session early will prevent the play from being marked as complete.</p>
						<p>If all items above check out, contact support. Support can verify the score and ensure your grade is properly updated.</p>
					</dd>
					<dt>How many times can I play a widget?</dt>
					<dd>
						<p>By default, widgets can be played as many times as you want. When embedded as assignments, your highest score is the one synced with the gradebook. If your instructor has set an attempt limit,
						the additional attempt count will be displayed on the score screen alongside the Play Again button.</p>
					</dd>
					<dt>Can I see scores from widgets I've previously played in Materia?</dt>
					<dd>
						<p>You can! Log in to Materia directly, if you're not already authenticated. Then, visit your profile by clicking your name at the top right, or the 
						My Profile link the header. Your profile page will list your complete play history for every widget you've previously interacted with.</p>
					</dd>
					<dt>Can I make my own widget?</dt>
					<dd>
						<p>Students can make widgets, but there's one important limitation: the widget will be set to Guest Mode, which means it won't know who is playing it, and consequently, score
						data will be anonymous.</p>
					</dd>
					<dt>What's the answer to life, the universe, and everything?</dt>
					<dd>
						<p>That's a really big question, but we're pretty sure the answer is 42.</p>
					</dd>
				</dl>
			</section>
		</>
	)
}

export default HelpForStudents
