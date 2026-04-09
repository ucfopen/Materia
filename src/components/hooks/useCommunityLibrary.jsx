import { useMemo } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from 'react-query'
import {
	apiGetCommunityLibrary,
	apiCopyFromLibrary,
	apiToggleLike,
	apiReportEntry,
	apiPublishToLibrary,
	apiUnpublishFromLibrary,
	apiUpdateInLibrary,
	apiPullFromLibrary,
} from '../../util/api'
import { iconUrl } from '../../util/icon-url'

export function useCommunityLibraryList(search, widgetId, category, courseLevel, sort) {
	const formatData = (list) => {
		if (list?.pages) {
			return list.pages.flatMap((page) =>
				page.results.map((entry) => ({
					...entry,
					img: iconUrl('/widget/', entry.widget?.dir, 275),
				})),
			)
		}
		return []
	}

	const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
		useInfiniteQuery({
			queryKey: ['community-library', search, widgetId, category, courseLevel, sort],
			queryFn: ({ pageParam = 1 }) =>
				apiGetCommunityLibrary({
					pageParam,
					search,
					widgetId,
					category,
					courseLevel,
					sort,
				}),
			getNextPageParam: (lastPage) =>
				lastPage.next != null ? lastPage.next.match(/page=([0-9]+)/)[1] : undefined,
			refetchOnWindowFocus: false,
		})

	const entries = useMemo(() => formatData(data), [data])

	return {
		entries,
		isFetching,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
	}
}

export function useCopyFromLibrary() {
	const queryClient = useQueryClient()
	return useMutation(apiCopyFromLibrary, {
		onSuccess: () => {
			queryClient.invalidateQueries(['instances'])
			queryClient.invalidateQueries(['community-library'])
		},
	})
}

export function useToggleLike() {
	const queryClient = useQueryClient()
	return useMutation(apiToggleLike, {
		onSuccess: () => {
			queryClient.invalidateQueries(['community-library'])
		},
	})
}

export function useReportEntry() {
	const queryClient = useQueryClient()
	return useMutation(({ entryId, data }) => apiReportEntry(entryId, data), {
		onSuccess: () => {
			queryClient.invalidateQueries(['community-library'])
		},
	})
}

export function usePublishToLibrary() {
	const queryClient = useQueryClient()
	return useMutation(({ instId, data }) => apiPublishToLibrary(instId, data), {
		onSuccess: () => {
			queryClient.invalidateQueries(['community-library'])
		},
	})
}

export function useUnpublishFromLibrary() {
	const queryClient = useQueryClient()
	return useMutation(apiUnpublishFromLibrary, {
		onSuccess: () => {
			queryClient.invalidateQueries(['community-library'])
		},
	})
}

export function useUpdateInLibrary() {
	const queryClient = useQueryClient()
	return useMutation(apiUpdateInLibrary, {
		onSuccess: () => {
			queryClient.invalidateQueries(['community-library'])
		},
	})
}

export function usePullFromLibrary() {
	const queryClient = useQueryClient()
	return useMutation(apiPullFromLibrary, {
		onSuccess: () => {
			queryClient.invalidateQueries(['instances'])
		},
	})
}
