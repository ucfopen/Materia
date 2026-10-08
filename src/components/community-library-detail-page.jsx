import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGetLibraryEntry, apiGetWidget } from '../util/api'
import Header from './header'
import CommunityLibrary from './community-library'
import CommunityLibraryDetail from './community-library-detail'

const CommunityLibraryDetailPage = () => {
	const id = window.location.pathname.replace("/community-library/", "").replace("/", "")
	const { data: entry, error: queryError} = useQuery({
		queryKey: ['cl-entry', id],
		queryFn: () => apiGetLibraryEntry(id),
		staleTime: Infinity,
		retry: false,
		refetchOnWindowFocus: false
	})

	return (
		<>
			<Header />
			<CommunityLibraryDetail entry={entry} queryError={queryError} />
		</>
	)
}

export default CommunityLibraryDetailPage
