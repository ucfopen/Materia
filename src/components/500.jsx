import React from 'react'
import Header from './header'
import SupportInfo from './support-info'

const Action500 = () => (
	<>
		<Header />
    <div className="container general" id="broken">
    	<section className="page">
    		<h1>500</h1>
    		<p>
    			Uh oh! Something's broken. Looks like an internal server error.
    			To get help with resolving this issue, contact support below.
    		</p>
    	</section>

    	<div id="supportInfo">
    		<SupportInfo/>
    	</div>
    </div>
	</>
)

export default Action500
