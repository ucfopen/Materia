import React from 'react'
import Header from './header'
import './404.scss'

const Action404 = () => (
	<>
		<Header />
    <div className="container general" id="notfound">
    	<section className="page">
    		<h1>404</h1>
    		<p>We may have lost the page you're looking for.</p>
    	</section>
    </div>
	</>
)

export default Action404
