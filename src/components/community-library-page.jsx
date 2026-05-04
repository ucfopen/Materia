import React from 'react'
import { useQuery } from 'react-query'
import { apiGetWidget } from '../util/api'
import Header from './header'
import CommunityLibrary from './community-library'

const CommunityLibraryPage = () => {
	const { data: widgets } = useQuery({
		queryKey: 'catalog-widgets',
		queryFn: () => apiGetWidget([], 'catalog'),
		staleTime: Infinity,
	})

	return (
		<>
			<Header />
			<CommunityLibrary widgets={widgets || []} />
		</>
	)
}

export default CommunityLibraryPage
