import React from 'react';
import Summary from './widget-summary'
import EmbedFooter from './widget-embed-footer';
import EmbeddedOnlyText from 'MateriaText/errors/embedded-only.mdx'

const EmbeddedOnly = () => {
  return (
	<div className="container widget">
		<section className="page">
			<Summary/>

			<div className="detail icon-offset unavailable">
				<EmbeddedOnlyText />
			</div>

			<EmbedFooter/>
		</section>
	</div>
  )
}

export default EmbeddedOnly
