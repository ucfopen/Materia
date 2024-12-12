import React, { useEffect, useState } from 'react'

const EmbedFooter = () => {

	const [isDarkMode, setDarkMode] = useState(false)

	useEffect(() => {
		const bodyRef = document.body
		if (bodyRef && bodyRef.classList.contains('darkMode')) {
			setDarkMode(true)
		}
	},[])

	let logoRef = isDarkMode ? "/img/materia-logo-thin-darkmode.svg" : "/img/materia-logo-thin.svg"

	return (
		<section className='widget-embed-footer'>
			<a className="materia-logo" href={window.BASE_URL} target="_blank"><img src={logoRef} alt="materia logo" /></a>
			<span>
				Content embedded from Materia. Need a hand? View <a className='inline-link' href={`${window.BASE_URL}/help#students`} target='_blank'>support options</a>.
			</span>
		</section>
	)
}

export default EmbedFooter