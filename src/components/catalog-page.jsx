import React from 'react'
import { useQuery } from 'react-query'
import { apiGetWidgetsByType } from '../util/api'
import Header from './header'
import Catalog from './catalog'

const CatalogPage = () => {
	const { data: widgets, isLoading} = useQuery({
		queryKey: 'catalog-widgets',
		queryFn: () => apiGetWidgetsByType('catalog'),
		staleTime: Infinity
	})

	return (
		<>
			<Header />
			<Catalog widgets={widgets} isLoading={isLoading} />
		</>
	)
}

export default CatalogPage
