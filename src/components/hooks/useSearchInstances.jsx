import { useState, useEffect, useMemo } from 'react'
import { useInfiniteQuery } from 'react-query'
import { apiSearchInstances } from '../../util/api'
import { iconUrl } from '../../util/icon-url'

export default function useSearchInstances(query = "") {

	const [errorState, setErrorState] = useState(false)

	// transforms data object returned from infinite query
	const formatData = (list) => {
		if (list?.type == 'error') {
			console.error(`Widget instances failed to load with error: ${list.msg}`);
			setErrorState(true)
			return []
		}
		if (list?.pages) {
			let dataMap = []
			return [
				...dataMap.concat(
					...list.pages.map(page => page.pagination.map(instance => {
						// adding an 'img' property to widget instance objects
						return {
							...instance,
							img: iconUrl(BASE_URL + 'widget/', instance.widget.dir, 275)
						}
					}))
				)
			]
		} else return []
	}

	const getWidgetInstances = ({ pageParam = 0 }) => {
		return apiSearchInstances(query, pageParam)
	}

	const {
		data,
		error,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isFetchingNextPage,
		status,
		refetch
	} = useInfiniteQuery({
		queryKey: ['searched_instances', query],
		queryFn: getWidgetInstances,
		enabled: query.length > 0,
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
		refresh: () => refetch(),
		...(errorState == true ? {error: true} : {}) // the error value is only provided if errorState is true
	}
}
