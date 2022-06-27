import React from 'react'
import Header from './header'
import './homepage.scss'

const Homepage = () => (
	<>
		<Header />
		<section className='page spotlight'>
			<section className='main_container'>
					<article className='store_main'>
						<section>
							<div className="store_content">
								<h1>Create <span className="engage">Engaging</span> Apps!</h1>
								<div>
									<p>With Materia, you have the power to create effective, interactive learning tools called <b>Widgets.</b></p>
									<p>Browse our catalog and begin customizing in seconds. Widgets can be tailored to suit your needs, no matter the subject matter.</p>
									<p>Best of all, widgets can be embedded directly in your LMS to enhance your online course.</p>
									<p className='button_wrap'>
										<a className='action_button' href='widgets'>Get Started</a>
									</p>
								</div>
								<img className="mobile_spotlight_banner" src='/img/banner_final.png' alt='homepage final banner design for materia'/>
							</div>
						</section>
					</article>
			</section>
		</section>

		<section className='get_started'>
		<img src="/img/social-ucf-open.png"/>

			<div className='get_started_content'>
					<h1 className='subHeader'> Materia is Open Source! </h1>
			 			<p className='desc'>
							Use Materia at your organization through UCF Open.
						</p>
				<p className='button_wrap'>
					<a className='action_button' href='widgets'>Get Materia</a>
				</p>
			</div>
		</section>

		<section className='front_bottom'>
			<section className='wrapper'>
			<div className="wrapper_first">
				<div>
					<h2>Create Quickly and Easily</h2>
					<p className="front_bottom_desc">
						Materia's design philosophy is to be incredibly easy to use.
						Every step of customizing and delivering apps has been finely tuned to be as clear and simple as possible.
						Players are greeted with clean and simple interfaces.
						We aim to get out of the way so your content can engage with students as quickly and clearly as possible.
					</p>
				</div>
				<img src='/img/front2.png' alt='screen shot of creating a crossword widget'/>
			</div>
			<div className="wrapper_second">
				<div>
					<h2>Engage Your Students</h2>
					<p className="front_bottom_desc">
						Re-imagine your course filled with diverse and interesting experiences.
						It can bring life to content modules, practice, study activities, and even assessments.
						Engage students with game mechanics like: story-telling, competition, instant feedback, and instant reward systems.
					</p>
				</div>
				<img src='/img/front1.png' alt='screen shot of a labeling widget' />
			</div>
			<div className="wrapper_third">
				<div>
					<h2>Integrate with Your Course</h2>
					<p className="front_bottom_desc">
						Materia integrates into Canvas seamlessly.
						As an assignment, student's scores can automatically sync to the grade book.
						Thanks to the magic of LTI, Students are logged in automatically!
					</p>
				</div>
				<img src='/img/front3.png' alt='screen shot of a widget score page'/>
			</div>
			</section>

			<section className='p_s'>
				<h2>Built at UCF, for Everyone</h2>
				<p>
					Materia is an open source project built by the University of Central Florida's <a href='https://cdl.ucf.edu/' target='_blank'>Center for Distributed Learning</a>.
					Our team is a truly unique group of experts working directly with faculty <b>and</b> students to build enjoyable tools for teaching and learning.
				</p>
				<p>
					We're committed to building a better tomorrow through better learning tools, so our team is constantly improving and re-inventing Materia.
					If you have an idea for a new widget or simply would like to give us feedback, we'd love to hear from you on <a href='https://github.com/ucfopen' target='_blank'>Github</a>.
				</p>
				<p className='copyright'>
					&copy; {new Date().getFullYear()} University of Central Florida
				</p>
			</section>
		</section>
	</>
)

export default Homepage
