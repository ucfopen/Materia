import React, { useState, useEffect } from 'react'
import Header from './header'

import HelpHome from './help-home'
import HelpForStudents from './help-for-students'
import HelpForInstructors from './help-for-instructors'

import './help-page.scss';

const HelpPage = () => {

	const [page, setPage] = useState(window.location.hash.match(/#(home|students|instructors){1}$/)?.[1])

	const listenToHashChange = () => {
		const match = window.location.hash.match(/#(home|students|instructors){1}$/)
		if (match != null && match[1] != null) setPage(match[1])
		else setPage('home')
	}
	
	useEffect(() => {
		window.addEventListener('hashchange', listenToHashChange)
	
		return () => {
			window.removeEventListener('hashchange', listenToHashChange)
		}
	}, [])

	let helpContentRender = null
	switch (page) {
		case 'students':
			helpContentRender = <HelpForStudents />
			break
		case 'instructors':
			helpContentRender = <HelpForInstructors />
			break
		default:
			helpContentRender = <HelpHome />
	}

	return (
		<>
			<Header />
			<div className="container">
				<section className="page">
					<h1>Help &amp; Support</h1>
					<section className='content'>
						<nav className='navigation'>
							<ul>
								<li><a href='#home'>Help Home</a></li>
								<li><a href='#students'>For Students</a></li>
								<li><a href='#instructors'>For Instructors</a></li>
							</ul>
						</nav>
						<main>
							{helpContentRender}
						</main>
					</section>
				</section>
			</div>
		</>
	)
}

export default HelpPage
