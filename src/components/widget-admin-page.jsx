import { apiGetWidget } from '../util/api'
import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import Header from './header'
import WidgetInstall from './widget-admin-install'
import WidgetList from './widget-admin-list'
import { iconUrl } from '../util/icon-url'
import WidgetUpdater from "@/components/widget-admin-updater"

const WidgetAdminPage = () => {
	const { data: widgets, error: widgetError, isLoading, refetch: refetchWidgets } = useQuery({
		queryKey: ['widgets'],
		queryFn: () => apiGetWidget([], 'admin'),
		staleTime: Infinity,
		retry: false
	})

	if (widgetError) {
		console.error('Error fetching widgets:', widgetError)
	}

	const normalWidgets = useMemo(() => {
		if (!widgets) return []

		return widgets.map((w) => ({
			...w,
			icon: iconUrl('/widget/', w.dir, 60),
			in_catalog: !!+w.in_catalog,
			is_editable: !!+w.is_editable,
			restrict_publish: !!+w.restrict_publish,
			is_scorable: !!+w.is_scorable,
			is_playable: !!+w.is_playable,
			is_answer_encrypted: !!+w.is_answer_encrypted,
			is_qset_encrypted: !!+w.is_qset_encrypted,
			is_storage_enabled: !!+w.is_storage_enabled,
			is_scalable: !!+w.is_scalable
		}))
	}, [widgets])

	let pageRenderContent = (
        <>
            <WidgetInstall refetchWidgets={refetchWidgets} />
            <WidgetUpdater widgets={normalWidgets} isLoading={isLoading} />
            <WidgetList widgets={normalWidgets} isLoading={isLoading} />
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
