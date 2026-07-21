import { useMemo } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from 'react-query'
import {
	apiGetCommunityLibrary,
	apiCopyFromLibrary,
	apiToggleLike,
	apiReportEntry,
	apiPublishToLibrary,
	apiUnpublishFromLibrary,
	apiUpdateInLibrary,
	apiPullFromLibrary,
	apiGetLibraryTags,
	apiDeleteLibraryTag,
	apiRenameLibraryTag,
	apiPatchLibraryCategory,
	apiDeleteLibraryCategory
} from '../../util/api'
import { iconUrl } from '../../util/icon-url'

export function useCommunityLibraryList(limit, search, widgetId, categories, courseLevel, sort, tags, featuredOnly) {
	
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
			queryKey: ['community-library', limit, search, widgetId, categories, courseLevel, sort, tags, featuredOnly],
			queryFn: ({ pageParam = 1 }) =>
				apiGetCommunityLibrary({
					limit,
					pageParam,
					search,
					widgetId,
					categories,
					courseLevel,
					sort,
					tags,
					featuredOnly
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

export function useTagList(count, search, exclude) {
	return useQuery({
		queryKey: ["tags", count, search, exclude],
		queryFn: async () => {
			const response = await apiGetLibraryTags({count, search, exclude})
			const tags = response != undefined && response.length ? response : []
			tags.sort((a, b) => a.used_count < b.used_count)
			return tags
		},
		enabled: true,
		refetchOnWindowFocus: false
	})
}

export function useDeleteTag() {
	const queryClient = useQueryClient()
	return useMutation(apiDeleteLibraryTag, {
		onSuccess: () => {
			queryClient.invalidateQueries(['community-library'])
		}
	})
}

export function useRenameTag() {
	const queryClient = useQueryClient()
	return useMutation(({ name, to }) => apiRenameLibraryTag(name, to), {
		onSuccess: () => {
			queryClient.invalidateQueries(['community-library'])
		}
	})
}

export function useUpdateCategory() {
	const queryClient = useQueryClient()
	return useMutation(({slug, changes}) => apiPatchLibraryCategory(slug, changes), {
		onSuccess: () => {
			queryClient.invalidateQueries(['category-moderation'])
		}
	})
}

export function useDeleteCategory() {
	const queryClient = useQueryClient()
	return useMutation(({slug}) => apiDeleteLibraryCategory(slug), {
		onSuccess: () => {
			queryClient.invalidateQueries(['category-moderation'])
		}
	})
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
