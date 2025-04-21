import { useState, useEffect, useMemo } from 'react'
import { useInfiniteQuery } from 'react-query'
import { apiGetUserPlaySessions } from '../../util/api'

// facilitates paginated requests for widget instances. Returns a flat list with some handlers associated with the query.
// will default to the current user ("me"), but allows requests for another user id if passed as a param on init or via the exposed setUser method.
export default function useGetPlaySessions(user, autofetch) {

	const [errorState, setErrorState] = useState(false)

	// transforms data object returned from infinite query into one we can use in the my-widgets-page component
	// this creates a flat list of instances from the paginated list that's subsequently sorted
	const formatData = (list) => {
		if (list?.type == 'error') {
			console.error(`Play sessions failed to load with error: ${list.msg}`);
			setErrorState(true)
			return []
		}
		if (list?.pages) {
			let dataMap = []
			return [
				...dataMap.concat(
					...list.pages.map(page => page.results)
				)
			]
		} else return []
	}

	const getPlaySessions = ({pageParam = 1}) => {
		return apiGetUserPlaySessions(user, pageParam)
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
		queryKey: ['user-activity', user],
		queryFn: getPlaySessions,
		getNextPageParam: (lastPage, pages) => lastPage.next != null ? lastPage.next.match(/page=([0-9]+)/)[1] : undefined,
		refetchOnWindowFocus: false
	})

	useEffect(() => {
		if (error != null && error != undefined) setErrorState(true)
	},[error])

	// memoize the instance list since this is a large, expensive query
	const playSessions = useMemo(() => formatData(data), [data])

	console.log(isFetching)

	useEffect(() => {
		if (hasNextPage && autofetch) fetchNextPage()
	},[playSessions])

	return {
		plays: playSessions,
		isFetching: isFetching,
		hasNextPage: hasNextPage,
		fetchNextPage: fetchNextPage,
		...(errorState == true ? {error: true} : {}) // the error value is only provided if errorState is true
	}
}
