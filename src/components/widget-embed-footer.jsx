import React from 'react'

const EmbedFooter = () => {

	return (
		<section className='widget-embed-footer'>
			<a className="materia-logo" href={window.BASE_URL} target="_blank"><img src="/img/materia-logo-thin.svg" alt="materia logo" /></a>
			<span>
				Content embedded from Materia. Need a hand? View <a className='inline-link' href={`${window.BASE_URL}/help#students`} target='_blank'>support options</a>.
			</span>
		</section>
	)
}

export default EmbedFooter