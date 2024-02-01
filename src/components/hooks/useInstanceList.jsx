import { useState, useEffect, useMemo } from 'react'
import { useInfiniteQuery } from 'react-query'
import { apiGetUserWidgetInstances } from '../../util/api'
import { iconUrl } from '../../util/icon-url'

export default function useInstanceList() {

	const [errorState, setErrorState] = useState(false)

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
			return [
				...dataMap.concat(
					...list.pages.map(page => page.pagination.map(instance => {
						// adding an 'img' property to widget instance objects for continued
						//  compatibility with any downstream LTIs using the widget picker
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
		return apiGetUserWidgetInstances(pageParam)
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
		refresh: () => refetch(),
		...(errorState == true ? {error: true} : {}) // the error value is only provided if errorState is true
	}
}
