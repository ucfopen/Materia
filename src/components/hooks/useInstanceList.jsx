import { useState, useEffect, useMemo } from 'react'
import { useInfiniteQuery } from 'react-query'
import { apiGetWidgetInstances } from '../../util/api'

export default function useInstanceList() {

	const [errorState, setErrorState] = useState(false)

	// Helper function to sort widgets
	const _compareWidgets = (a, b) => { return (b.created_at - a.created_at) }

	// transforms data object returned from infinite query into one we can use in the my-widgets-page component
	// this creates a flat list of instances from the paginated list that's subsequently sorted
	const formatData = (list) => {
		if (list?.type == 'error') {
			console.error(`Widget instances failed to load with error: ${list.msg}`);
			setErrorState(true)
			return []
		}
		if (list?.pages) {
			let dataMap = []
			return [...dataMap.concat(...list.pages.map((page) => page.pagination))].sort(_compareWidgets)
		} else return []
	}

	const getWidgetInstances = ({ pageParam = 0}) => {
		return apiGetWidgetInstances(pageParam)
	}

	const {
		data,
		error,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isFetchingNextPage,
		status,
	} = useInfiniteQuery({
		queryKey: ['widgets'],
		queryFn: getWidgetInstances,
		getNextPageParam: (lastPage, pages) => lastPage.next_page,
		refetchOnWindowFocus: false
	})

	useEffect(() => {
		if (error != null && error != undefined) setErrorState(true)
	},[error])

	// memoize the instance list since this is a large, expensive query
	const instances = useMemo(() => formatData(data), [data])
	
	useEffect(() => {
		if (hasNextPage) fetchNextPage()
	},[instances])

	return {
		instances: instances,
		isFetching: isFetching || hasNextPage,
		...(errorState == true ? {error: true} : {}) // the error value is only provided if errorState is true
	}
}