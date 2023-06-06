import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { apiGetWidgetInstance, apiRequestAccess } from '../../util/api'
import { iconUrl as getIconUrl } from '../../util/icon-url'

const SelectItem = () => {
	const nameArr = window.location.pathname.split('/')
	const instID = nameArr[nameArr.length - 1]
	const [iconUrl, setIconUrl] = useState('')
	const [userOwnsInstance, setUserOwnsInstance] = useState(false)
	const [previewEmbedUrl, setPreviewEmbedUrl] = useState('')
	const [requestSuccess, setRequestSuccess] = useState(null)
	const [requestSuccessID, setRequestSuccessID] = useState(null)
	const [instanceOwners, setOwnerList] = useState([])

	const { data: instance } = useQuery({
		queryKey: 'instance',
		queryFn: () => apiGetWidgetInstance(instID),
		placeholderData: {},
		staleTime: Infinity,
		onSuccess: (data) => {
			if (data && data.widget)
				setIconUrl(getIconUrl('/widget/', data.widget.dir, 92))
		}
	})

	useEffect(() => {
		if (window && window.OWNER_LIST)
		{
			setOwnerList(window.OWNER_LIST)
		}
	}, [window.OWNER_LIST])

	useEffect(() => {
		if (window && window.PREVIEW_EMBED_URL) {
			setPreviewEmbedUrl(window.PREVIEW_EMBED_URL)
		}
	}, [window.PREVIEW_EMBED_URL])

	useEffect(() => {
		if (window && window.CURRENT_USER_OWNS) {
			setUserOwnsInstance(!!window.CURRENT_USER_OWNS)
		}
	}, [window.CURRENT_USER_OWNS])

	const requestAccess = async (ownerID) => {
		await apiRequestAccess(instID, ownerID).then((data) => {
			if (data) setRequestSuccess('Request succeeded')
			else setRequestSuccess('Request Failed')
			setRequestSuccessID(ownerID)
		})
	}

	let ownerList = null
	if (instanceOwners && Array.isArray(instanceOwners)) {
		ownerList = instanceOwners.map((owner, index) => {
			return <li className="instance_owner" key={index}>
				<span>{owner.first} {owner.last}</span>
				<button id={'owner-' + owner.id} className="action_button request_widget_access" onClick={() => requestAccess(owner.id)} disabled={requestSuccess !== null && requestSuccessID == owner.id}>Request Access</button>
				{requestSuccess !== null && requestSuccessID == owner.id ? <span className="request_success">{requestSuccess}</span> : <></>}
			</li>
		})
	}

	let sectionRender = null
	if (userOwnsInstance)
	{
		sectionRender =
			<section>
				<div className="container">
					<div className="widget_info">
						<div className="widget_icon">
							<img src={iconUrl} alt={instance.name || `${instance.type} Widget Icon`}/>
						</div>
						<div className="widget_name">{instance.name}</div>
					</div>
					<p>The widget is successfully embedded. When supported, Materia will synchronize scores.</p>
					<p>This confirmation screen is displayed because Materia recognizes you as an author. Students will see the widget instead of this message. You may preview the widget using the button below.</p>
					<a className="action_button" href={previewEmbedUrl} target="_blank">Start Preview</a>
				</div>
			</section>
	} else {
		sectionRender = <section>
			<div className="container not_an_owner">
				<div className="widget_info">
					<div className="widget_icon">
						<img src={iconUrl} alt={instance.name || 'Type Widget Icon'}/>
					</div>
					<div className="widget_name">{instance.name}</div>
				</div>
				<h3>You don't own this widget!</h3>
				<p>Don't worry: students will see the widget instead of this message, and it will continue to synchronize scores if configured to do so.</p>
				<p>You may contact one of the widget owners listed below to request access to this widget. Clicking the Request Access option will notify them and provide them the option to add you as a collaborator.</p>
				<ul>
					{ownerList}
				</ul>
			</div>
		</section>
	}

	return (<>
		<header className={`${userOwnsInstance ? 'preview-success' : 'preview-warning'}`}>
			<h1>Materia Widget Embedded</h1>
			<div id="logo"></div>
		</header>
		{sectionRender}
	</>)
}

export default SelectItem
