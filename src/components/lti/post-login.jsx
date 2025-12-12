import React, { useState, useEffect } from 'react'
import { waitForWindow } from '../../util/wait-for-window'


const PostLogin = () => {

	const [isAuthor, setIsAuthor] = useState(false)

	useEffect(() => {
		waitForWindow(['IS_AUTHOR']).then(() => {
			setIsAuthor(window.IS_AUTHOR)
		})
	}, [])

	const instructor_page = (
		<>
			<header className="header-for-instructors">
				<h1>Enhance Your Course With Widgets</h1>
				<p>Create interactive learning content in minutes. No coding required. Select a widget, customize it, and share it with students.</p>
				<ul>
					<li>
						<h3>Quick to Create</h3>
						Build widgets in minutes.
					</li>
					<li>
						<h3>Auto-Grading</h3>
						Scores sync to your gradebook when you use a widget as an assignment.
					</li>
					<li>
						<h3>Enhance Student Engagement</h3>
						Gamified learning experiences enhance learning outcomes.
					</li>
				</ul>
				<section className="instructors-header-nav">
					<a className="action_button" href={`${window.BASE_URL}widgets`} target="_blank">Browse Widget Catalog</a>
					<a className="regular_button" href="https://www.youtube.com/watch?v=sYrBW7LHOh8" target="_blank">Watch Introduction</a>
				</section>
			</header>
			<section className="widget-creation-timeline">
				<h2>Creating a Widget is Easy</h2>
				<span>Follow these simple steps to engage your students</span>
				<ul>
					<li className="widget-creation-card">
						<img src="/static/img/lti/creating-widgets-icon-choose.svg" alt="Icon of a white paint palette on a purple background" />
						<h3>Choose</h3>
						Select a widget type from our catalog
					</li>
					<li className="widget-creation-card">
						<img src="/static/img/lti/creating-widgets-icon-customize.svg" alt="Icon of a white pencil on a blue background" />
						<h3>Customize</h3>
						Customize the widget with your course content
					</li>
					<li className="widget-creation-card">
						<img src="/static/img/lti/creating-widgets-icon-preview.svg" alt="Icon of a white eye on a green background" />
						<h3>Preview</h3>
						Take your wiget for a test drive!
					</li>
					<li className="widget-creation-card">
						<img src="/static/img/lti/creating-widgets-icon-publish.svg" alt="Icon of a white share icon on an orange background" />
						<h3>Publish</h3>
						Your widget is ready to be embedded in your course
					</li>
				</ul>
			</section>
			<section className="widget-types-list">
				<header>
					<h4><span>20+ WIDGET TYPES</span></h4>
					<h2>Built for Your Discipline</h2>
					<span>
						From STEM labs to language practice, find the perfect interactive tool for your teaching needs.
						Every widget in our catalog was designed in collaboration with faculty members just like you.
					</span>
				</header>
				<ul className="widget-types">
					<li className="widget-type-row">
						<div className="widget-type-card">
							<header>
								<h3>STEM</h3>
								Interactive Learning Tools
							</header>
							<p>Labeling diagrams, equations, physics simulations</p>
						</div>
						<ul className="widget-type-examples">
						<li>
							<img src="/static/img/lti/example-widget-icons/slope-finder.png" alt="Slope Finder widget icon" />
							Slope Finder
							</li>
						<li>
							<img src="/static/img/lti/example-widget-icons/node-graph.png" alt="Node Graph widget icon" />
							Node Graph
						</li>
						<li>
							<img src="/static/img/lti/example-widget-icons/equation-sandbox.png" alt="Equation Sandbox widget icon" />
							Equation Sandbox
						</li>
						</ul>
					</li>
					<li className="widget-type-row">
						<div className="widget-type-card">
							<header>
								<h3>Languages</h3>
								Interactive Learning Tools
							</header>
							<p>Vocabulary flashcards and word searches</p>
						</div>
					<ul className="widget-type-examples">
						<li>
							<img src="/static/img/lti/example-widget-icons/syntax-sorter.png" alt="Syntax Sorter widget icon" />
							Syntax Sorter
						</li>
						<li>
							<img src="/static/img/lti/example-widget-icons/crossword.png" alt="Crossword widget icon" />
							Crossword
						</li>
						<li>
							<img src="/static/img/lti/example-widget-icons/word-search.png" alt="Word Search widget icon" />
							Word Search
						</li>
					</ul>
					</li>
					<li className="widget-type-row">
						<div className="widget-type-card">
							<header>
								<h3>Business and Social Science</h3>
								Interactive Learning Tools
							</header>
							<p>Case study matching, concept sorting, scenario analysis</p>
						</div>
					<ul className="widget-type-examples">
						<li>
							<img src="/static/img/lti/example-widget-icons/adventure.png" alt="Adventure widget icon" />
							Adventure
						</li>
						<li>
							<img src="/static/img/lti/example-widget-icons/enigma.png" alt="Enigma widget icon" />
							Enigma
						</li>
						<li>
							<img src="/static/img/lti/example-widget-icons/guess-the-phrase.png" alt="Guess the Phrase widget icon" />
							Guess the Phrase
						</li>
					</ul>
					</li>
				</ul>
			</section>
			<section className="faq">
				<h2>Frequently Asked Questions</h2>
				<dl>
					<dt>
						How long does it take to create a widget?
					</dt>
					<dd>
						You can customize a widget in a manner of minutes! Every widget contains a bespoke authoring interface that's designed to
						be easy and intuitive.
					</dd>
					<dt>
						Will my students' grades sync automatically?
					</dt>
					<dd>
						If your widget is embedded as an external tool in an assignment, it will seamlessly sync the student's score
						with the gradebook for that assignment. Bear in mind that some widgets do not have a scoring component; these 
						work best as study tools or for supplemental learning.
					</dd>
					<dt>
						Can I reuse widgets across courses?
					</dt>
					<dd>
						Yes you can! Widgets can be used in multiple courses, or even outside of your course completely.
					</dd>
					<dt>
						What if I need help getting started?
					</dt>
					<dd>
						Check out our <a href={`${window.BASE_URL}help#instructors`} target="_blank">help page for instructors</a> or visit additional support resources below!
					</dd>
				</dl>
			</section>
			<footer>
				<div className="footer-content">
					<h3>Ran into an issue? <a href={`${window.BASE_URL}help`} target="_blank">Get Support</a></h3>
					<p>Join thousands of instructors making learning fun with Materia.</p>
					<section className="footer-links">
						<a className="action_button" href={`${window.BASE_URL}widgets`} target="_blank">Browse Widget Catalog</a>
						<a className="regular_button" href="https://www.youtube.com/watch?v=sYrBW7LHOh8" target="_blank">Watch Introduction</a>
					</section>
				</div>
			</footer>
		</>
	)

	const student_page = (
		<>
			<header className="header-for-students">
				<img src="/static/img/lti/for_students_kogneato_header.svg" alt="Kogneato the robot playing a game of hopscotch" />
				<h1>Turn Studying Into Play!</h1>
			</header>
			<section className="student-intro">
				<p>Master your coursework with Materia's interactive widgets. Create your own study games or play widgets from your instructor.</p>
				<div className="intro-links">
					<a className="action_button" href={`${window.BASE_URL}widgets`} target="_blank">Browse Widget Catalog</a>
					<a className="regular_button" href={`${window.BASE_URL}profile`} target="_blank">My Play History</a>
				</div>
			</section>
			<section className="widget-play-timeline">
				<ul>
					<li>
						<h3>From Instructors</h3>
						Play widgets your instructor has created and embedded in your course.
					</li>
					<li>
						<h3>Play & Practice</h3>
						Test yourself with instant scoring and feedback.
						<img src="/static/img/lti/students-timeline-play-and-practice.svg" alt="A stylized graphic of a user interface receiving a 84% score." />
					</li>
					<li>
						<h3>Create Your Own</h3>
						Build your own study games in just a couple minutes.
						<img src="/static/img/lti/students-timeline-create-your-own.svg" alt="A stylized image of a series of UI panels stacked on top of each other." />
					</li>
				</ul>
			</section>
			<footer>
				<div className="footer-content">
					<h3>Ran into an issue? <a href={`${window.BASE_URL}help`} target="_blank">Get Support</a></h3>
					<p>Materia was created with &hearts; at the University of Central Florida.</p>
					<section className="footer-links">
						{/* <a className="action_button" href={`${window.BASE_URL}widgets`} target="_blank">Browse Widget Catalog</a> */}
					</section>
				</div>
			</footer>
		</>
	)

	return (
		<section id="lti-login-section">
			{isAuthor ? instructor_page : student_page}
		</section>
	)
}

export default PostLogin
