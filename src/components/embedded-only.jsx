import React from 'react';
import Summary from './widget-summary'

const EmbeddedOnly = () => {
  return (
    <div className="container widget">
    	<section className="page">
    		<Summary/>

    		<div className="detail icon-offset">
    			<h2 className="unavailable-text">Not Playable Here</h2>
    			<span className="unavailable-subtext">Your instructor has not made this widget available outside of the LMS.</span>
    		</div>
    	</section>
    </div>
  )
}

export default EmbeddedOnly
