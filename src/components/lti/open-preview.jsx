import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { apiGetWidgetInstance, apiRequestAccess } from '../../util/api'
import { iconUrl as getIconUrl } from '../../util/icon-url'

const SelectItem = () => {
	const [iconUrl, setIconUrl] = useState('')
	const [provisionalAccess, setProvisionalAccess] = useState(false)
	const [previewEmbedUrl, setPreviewEmbedUrl] = useState('')

	const instID = window.INST_ID

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
		if (window && window.PREVIEW_EMBED_URL) {
			setPreviewEmbedUrl(window.PREVIEW_EMBED_URL)
		}
	}, [window.PREVIEW_EMBED_URL])

	useEffect(() => {
		if (window && window.PROVISIONAL_ACCESS) {
			setProvisionalAccess(!!window.PROVISIONAL_ACCESS)
		}
	}, [window.PROVISIONAL_ACCESS])


	let sectionRender = null
	if (!provisionalAccess)
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
				<h3>You have been given provisional access to this widget</h3>
				<p>Because you are an author in this course, you have been given limited access to this widget.</p>
				<p>It will now show up in My Widgets and you can view scores associated with this course.</p>
					<a className="action_button" href={`${window.BASE_URL}my-widgets/#${instID}`} target="_blank">View in My Widgets</a>
			</div>
		</section>
	}

	return (<>
		<header className={`${provisionalAccess ? 'preview-warning' : 'preview-success'}`}>
			<h1>Materia Widget Embedded</h1>
			<div id="logo"></div>
		</header>
		{sectionRender}
	</>)
}

export default SelectItem
