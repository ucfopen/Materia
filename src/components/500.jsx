import React from 'react'
import Header from './header'
import SupportInfo from './support-info'

import './500.scss'

const Action500 = () => (
	<>
		<Header />
    <div className="container general">
    	<section className="page">
    		<h1>500 :(</h1>
    		<p>
    			Uh oh! Something's broken. Looks like an internal server error.
    			To get help with resolving this issue, contact support below.
    		</p>
    	</section>

    	<div id="support-info-500">
    		<SupportInfo/>
    	</div>
    </div>
	</>
)

export default Action500
