import React from 'react';
import SupportInfo from './support-info'

const NoPermission = () => {
  return (
    <div className="container general" id="no_permission">
    	<section className="page no_permission">
    		<h1>You don't have permission to view this page.</h1>
    		<p>You may need to:</p>
    		<ul>
    			<li>Make sure you own this item.</li>
    			<li>Ask the owner to share it with you.</li>
    			<li>Make sure the item you are trying to access exists.</li>
    		</ul>

    		<SupportInfo/>
    	</section>
    </div>

  )
}

export default NoPermission
