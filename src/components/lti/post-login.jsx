import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { waitForWindow } from '../util/wait-for-window'

import { apiGetInstancesFromContext } from '../../util/api'
import { iconUrl as getIconUrl } from '../../util/icon-url'

const PostLogin = () => {
	const [staticURL, setStaticURL] = useState('')
	const [contextID, setContextID] = useState(null)

	useEffect(() => {
		waitForWindow(['STATIC_CROSSDOMAIN', 'CONTEXT_ID']).then(() => {
			setStaticURL(window.STATIC_CROSSDOMAIN)
			setContextID(window.CONTEXT_ID)
		})
	}, [])

	const { isLoading, data: instances } = useQuery({
		queryKey: ['lti-widgets', contextID],
		queryFn: () => apiGetInstancesFromContext(contextID),
		enabled: !!contextID,
		staleTime: Infinity
	})

	let instancesRender = null
	if (!!instances) {
		instancesRender = instances.map((instance, index) => {
			const iconUrl = getIconUrl('/widget/', instance.widget.dir, 92)

			const resource_links = instance.lti_data.map(
				(resource, r_index) => <span key={r_index}>{resource.lti_resource_name}</span>
			)

			return <li key={index} className="instance">
				<img src={iconUrl} alt={instance.name}></img>
				<h3>{instance.name}</h3>
				<section className="instance-quick-links">
					<a href={instance.preview_url} target="_blank">Preview</a>
					<a href={`${window.BASE_URL}my-widgets#${instance.id}`} target="_blank">Manage in Materia</a>
				</section>
				<span className="widget-located-in">This widget is embedded in the following assignments:</span>
				{resource_links}
			</li>
		})
	}

	return (
		<section id="lti-login-section">
		<header id="h1-div">
			<h1>
				Materia: Enhance Your Course with Widgets
			</h1>
		</header>
		<section className="instructor-intro">
			Materia can power-up your course with bite-size, interactive, gamified learning. 
			Select a widget, customize it in minutes, and share it with students. Widgets are great for
			supplemental learning, study aids, and low-stakes assessment. When embedded in your course,
			widgets will automatically sync scores with the gradebook.
		</section>
		<section className="instructor-instance-list">
			<p>The following widgets are currently detected in your course:</p>
			<ul className="instances">
				{instancesRender}
			</ul>
		</section>

	</section>
	)
}

export default PostLogin
