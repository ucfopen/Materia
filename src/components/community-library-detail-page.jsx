import React from 'react'
import { useQuery } from 'react-query'
import { apiGetLibraryEntry, apiGetWidget } from '../util/api'
import Header from './header'
import CommunityLibrary from './community-library'
import CommunityLibraryDetail from './community-library-detail'

const CommunityLibraryDetailPage = () => {
	const id = window.location.pathname.replace("/community-library/", "").replace("/", "")
	const { data: entry } = useQuery({
		queryKey: 'cl-entry',
		queryFn: () => apiGetLibraryEntry(id),
		staleTime: Infinity,
	})

	return (
		<>
			<Header />
			<CommunityLibraryDetail entry={entry}/>
		</>
	)
}

export default CommunityLibraryDetailPage
