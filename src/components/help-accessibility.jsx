import React from 'react';

const HelpAccessibility = () => {

	return (
		<>
			<section className='full-width'>
				<h2>Our Commitment to Accessibility</h2>
				<p>
					The UCF Center for Distributed Learning is committed to ensuring federal and institutional accessibility standards are met or exceeded with Materia 
					and its ecosystem of widgets. As a product of UCF, Materia is obligated to adhere to UCF's <a href="https://policies.ucf.edu/documents/2-006.pdf" target="_blank">Digital Accessibility Policy.</a>
				</p>

				<h3>Accessibility Standards and Compliance</h3>
				<p>
					Materia widgets are often highly interactive, gamified experiences that exceed the characteristics of traditional web documents.
					While we strive to ensure adherence to WCAG 2.0 AA standards wherever possible, certain widgets may not be fully capable of supporting those standards.  
					Widgets are proactively labeled based on their level of support for two major elements of WCAG 2.0 AA standards compliance: keyboard navigation and screen reader support.

					Materia and its widgets strive to adhere to the following accessibility guidelines:
				</p>
				<ul>
					<li>Web Content Accessibility Guidelines (WCAG) 2.0 Level AA</li>
					<li>Section 508 of the Rehabilitation Act</li>
					<li>Americans with Disabilities Act (ADA) digital accessibility requirements</li>
				</ul>
			</section>
			<section className='half-width'>
				<h3>Web Application Accessibility Features</h3>
				<ul>
					<li>Keyboard navigation support</li>
					<li>Screen reader compatibility</li>
					<li>Alternative text for images and graphics</li>
					<li>Consistent and predictable navigation</li>
					<li>Form input error identification and correction guidance</li>
				</ul>
				<h3>Supported Assistive Technologies</h3>
				<ul>
					<li>Screen readers (NVDA, JAWS, VoiceOver)</li>
					<li>Screen magnification tools</li>
					<li>Alternative input devices</li>
					<li>Speech-to-text and text-to-speech technologies</li>
				</ul>
			</section>
			<section className='half-width'>
				<h3>Widget Accessibility Specifications</h3>
				<ul>
					<li>Fully navigable using keyboard controls*</li>
					<li>Compatible with major assistive technologies*</li>
					<li>Clear and consistent interactive elements</li>
					<li>Semantic HTML structure</li>
					<li>Reasonable cognitive load for educational interactions</li>
				</ul>
				<span className='italic'>*Support may vary by widget. Refer to the accessibility description of each widget in the Widget Catalog.</span>
				<h3>Ongoing Accessibility Efforts</h3>
				<ul>
					<li>Regular accessibility testing</li>
					<li>Accessible design validation of new widgets as they are developed</li>
					<li>User feedback collection for continuous improvement</li>
					<li>Commitment to rapid remediation of identified accessibility barriers</li>
				</ul>
			</section>
			<section className='full-width'>
				<h3>Reporting Accessibility Issues</h3>
				<p>If you encounter any accessibility barriers or have suggestions for improvement, please contact us:</p>
				<dl>
					<dt>Email:</dt>
					<dd>ACCESSIBILITY EMAIL HERE</dd>
					<dt>Online:</dt>
					<dd>ACCESSIBILITY BARRIER REPORTING LINK</dd>
				</dl>
				<h3>Legal Compliance and Disclaimer</h3>
				<p>The UCF Center for Distributed Learning is dedicated to meeting or exceeding applicable accessibility standards. While we continuously work to improve our digital tools and services, we acknowledge that perfect accessibility is an ongoing journey.</p>
			</section>
		</>
	)
}

export default HelpAccessibility
