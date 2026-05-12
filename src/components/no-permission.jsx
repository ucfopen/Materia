import React from 'react'
import SupportInfo from './support-info'

import './no-permission.scss'

const NoPermission = () => {
  return (
	<>
		<div className="container general" id="no_permission">
			<section className="page no_permission">
				<h1>You don't have permission to view this page.</h1>

				<p>You may need to ask the owner to share it with you. If you think this error message is a mistake, contact support using the resources below.</p>

				<SupportInfo/>
			</section>
		</div>
	</>


  )
}

export default NoPermission
