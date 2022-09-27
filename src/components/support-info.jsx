import React, {useEffect, useState} from 'react'
import { Base64 } from 'js-base64'

import './support-info.scss'

const SupportInfo = () => {

	const [state, setState] = useState({
		supportInfo: []
	})

	const waitForWindow = async () => {
		while(!window.hasOwnProperty('SUPPORT_INFO')) {
			await new Promise(resolve => setTimeout(resolve, 500))
		}
	}

	useEffect(() => {
		waitForWindow()
		.then(() => {
			let parsed = JSON.parse(Base64.decode(window.SUPPORT_INFO))
			let sections = []
			for (let [section, values] of Object.entries(parsed)) {
				console.log(section)
				console.log(values)
				sections.push(
					<section key={section}>
						<h3>{values.title ? values.title : 'No title'}</h3>
						{values.subtitle ? <span className='subtitle'>{values.subtitle}</span> : ''}
						<dl className='contact'>
							{values.website ? 
								<>
									<dt>Website</dt>
									<dd><a href={values.website}>{values.website}</a></dd>
								</>
								: ''}
							{values.email ? 
								<>
									<dt>Email</dt>
									<dd><a href={`mailto:${values.email}`}>{values.email}</a></dd>
								</>
								: ''}
							{values.phone ?
								<>
									<dt>Phone</dt>
									<dd>{values.phone}</dd>
								</>
								: ''}
						</dl>
						
					</section>
				)
			}

			setState({
				supportInfo: sections
			})
		})
	}, [])

	return (
		<div className="error-support">
			{ state.supportInfo }
		</div>
 	)
}

export default SupportInfo
