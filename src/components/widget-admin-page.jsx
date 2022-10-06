import { apiGetWidgetsAdmin } from '../util/api'
import React, { useState } from 'react'
import { useQuery } from 'react-query'

import Header from './header'
import WidgetInstall from './widget-admin-install'
import WidgetList from './widget-admin-list'

const WidgetAdminPage = () => {
	const [widgets, setWidgets] = useState([])
	
	const { data, isLoading, refetch: refetchWidgets} = useQuery({
		queryKey: ['widgets'],
		queryFn: apiGetWidgetsAdmin,
		staleTime: Infinity,
		onSuccess: (widgetData) => {
			console.log(widgetData)
			widgetData.forEach((w) => {
				w.icon = Materia.Image.iconUrl(w.dir, 60)
				// Convert "0" and "1" to false and true
				w.in_catalog = !!+w.in_catalog
				w.is_editable = !!+w.is_editable
				w.restrict_publish = !!+w.restrict_publish
				w.is_scorable = !!+w.is_scorable
				w.is_playable = !!+w.is_playable
				w.is_answer_encrypted = !!+w.is_answer_encrypted
				w.is_qset_encrypted = !!+w.is_qset_encrypted
				w.is_storage_enabled = !!+w.is_storage_enabled
				w.is_scalable = !!+w.is_scalable
			})
			setWidgets(widgetData)
		}
	})
	
	let pageRenderContent = (
        <>
            <WidgetInstall refetchWidgets={refetchWidgets}/>
            <WidgetList widgets={widgets} isLoading={isLoading}/>
        </>
    )

	return (
		<>
			<Header />
			<div className="widget-admin-page">
				<div>
					{ pageRenderContent }
				</div>
			</div>
		</>
	)
}

export default WidgetAdminPage
