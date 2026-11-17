import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGetWidgetInstance } from '../../util/api'
import LoadingIcon from '../loading-icon'
import { iconUrl as getIconUrl } from '../../util/icon-url'
import { waitForWindow } from '../../util/wait-for-window'

const SelectItem = () => {

	const [state, setState] = useState({
		iconUrl: '',
		instID: '',
		provisionalAccess: false,
		previewEmbedUrl: ''
	})

	const { data: instance } = useQuery({
		queryKey: ['instance'],
		queryFn: () => apiGetWidgetInstance(state.instID),
		placeholderData: {},
		enabled: !!state.instID,
		staleTime: Infinity,
	})

	useEffect(() => {
		waitForWindow(['BASE_URL', 'INST_ID', 'PREVIEW_EMBED_URL', 'PROVISIONAL_ACCESS']).then(() => {
			setState(prevState => ({
				...prevState,
				instID: window.INST_ID,
				provisionalAccess: window.PROVISIONAL_ACCESS,
				previewEmbedUrl: window.PREVIEW_EMBED_URL
			}))
		})
		const url = new URL(window.location)
		url.searchParams.set('is_author', '1')
		history.pushState({}, '', url)
	}, [])

	useEffect(() => {
		if (instance?.id) {
			setState(prevState => ({
				...prevState,
				iconUrl: getIconUrl('/widget/', instance.widget?.dir, 92)
			}))
		}
	}, [instance?.id])

	let sectionRender = null
	if (!instance?.id) {
		sectionRender = <LoadingIcon />
	}
	else if (!state.provisionalAccess)
	{
		sectionRender =
			<section>
				<div className="container">
					<div className="widget_info">
						<div className="widget_icon">
							<img src={state.iconUrl} alt={instance?.name || `${instance?.type} Widget Icon`}/>
						</div>
						<div className="widget_name">{instance?.name}</div>
					</div>
					<p>The widget is successfully embedded. When supported, Materia will synchronize scores.</p>
					<p>This confirmation screen is displayed because Materia recognizes you as an author. Students will see the widget instead of this message. You may preview the widget using the button below.</p>
					<a className="action_button" href={state.previewEmbedUrl} target="_blank">Start Preview</a>
				</div>
			</section>
	} else {
		sectionRender = <section>
			<div className="container not_an_owner">
				<div className="widget_info">
					<div className="widget_icon">
						<img src={state.iconUrl} alt={instance?.name || 'Type Widget Icon'}/>
					</div>
					<div className="widget_name">{instance?.name}</div>
				</div>
				<h3>You have been given provisional access to this widget</h3>
				<p>Because you are an author in this course, you have been given limited access to this widget.</p>
				<p>It will now show up in My Widgets and you can view scores associated with this course.</p>
					<a className="action_button" href={`${window.BASE_URL}my-widgets/#${state.instID}`} target="_blank">View in My Widgets</a>
			</div>
		</section>
	}

	return (
		<>
			<header className={`${state.provisionalAccess ? 'preview-warning' : 'preview-success'}`}>
				<h1>Materia Widget Embedded</h1>
				<div id="logo"></div>
			</header>
			{sectionRender}
		</>
	)
}

export default SelectItem
