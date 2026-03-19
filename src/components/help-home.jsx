import React from 'react';
import GettingStarted from 'MateriaText/help/home/getting-started.mdx'
import Requirements from 'MateriaText/help/home/requirements.mdx'
import LoginIssues from 'MateriaText/help/home/login-issues.mdx'
import Support from 'MateriaText/help/home/support.mdx'
import Documentation from 'MateriaText/help/home/documentation.mdx'

const HelpHome = () => {

	return (
		<>
			<section className="full-width">
				<GettingStarted />
			</section>
			<section className="full-width">
				<Requirements />
			</section>

			<section className="half-width">
				<LoginIssues />
			</section>

			<section className="half-width">
				<Support />
			</section>
			<section className='full-width'>
				<Documentation />
			</section>
		</>
	)
}

export default HelpHome
