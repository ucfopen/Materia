import { useState, useEffect, useMemo } from 'react'
import { useInfiniteQuery } from 'react-query'
import { apiSearchUsers } from '../../util/api'

export default function useUserList(query = "") {

	const [errorState, setErrorState] = useState(false)

	// this creates a flat list of users from the paginated list
	const formatData = (list) => {
		if (list?.type == 'error') {
			console.error(`Users failed to load with error: ${list.msg}`);
			setErrorState(true)
			return []
		}
		if (list?.pages) {
            let dataMap = []
            list.pages.forEach(page => {
                dataMap.push(...page.pagination)
            })
            return dataMap
        }

        return []
	}

	const getData = ({ pageParam = 0 }) => {
        return apiSearchUsers(query, pageParam)
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
		queryKey: ['users', query],
		queryFn: getData,
		enabled: query.length > 0,
		getNextPageParam: (lastPage, pages) => {
			return lastPage.next_page
		},
		refetchOnWindowFocus: false
	})

	useEffect(() => {
		if (error != null && error != undefined) setErrorState(true)
	},[error])

	// memoize the user list since this is a large, expensive query
	const users = useMemo(() => formatData(data), [data])

	useEffect(() => {
		if (hasNextPage) fetchNextPage()
	},[users])

	return {
		users: users,
		isFetching: isFetching || hasNextPage,
		refresh: () => refetch(),
		...(errorState == true ? {error: true} : {}) // the error value is only provided if errorState is true
	}
}
