import { useMemo } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
	apiDeleteLibraryCategory,
	apiPostLibraryCategory,
	apiGetLibraryCategories,
	apiGetUserLibraryEntries
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

export function useUserPublishedEntriesList(userId) {
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
			queryKey: ['community-library', 'user', userId],
			queryFn: ({ pageParam = 1 }) =>
				apiGetUserLibraryEntries({pageParam, userId}),
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

export function useCategoryList() {
	return useQuery({
		queryKey: ['category-moderation'],
		queryFn: () => apiGetLibraryCategories(),
		enabled: true,
		staleTime: 30000
	})
}

export function useDeleteTag() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: apiDeleteLibraryTag,
		onSuccess: () => {
			queryClient.invalidateQueries(['community-library'])
		}
	})
}

export function useRenameTag() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ name, to }) => apiRenameLibraryTag(name, to),
		onSuccess: () => {
			queryClient.invalidateQueries(['community-library'])
		}
	})
}

export function useUpdateCategory() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({slug, changes}) => apiPatchLibraryCategory(slug, changes),
		onSuccess: () => {
			queryClient.invalidateQueries(['category-moderation'])
		}
	})
}

export function useDeleteCategory() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({slug}) => apiDeleteLibraryCategory(slug),
		onSuccess: () => {
			queryClient.invalidateQueries(['category-moderation'])
		}
	})
}

export function useCreateCategory() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({slug, changes}) => apiPostLibraryCategory(slug, changes),
		onSuccess: () => {
			queryClient.invalidateQueries(['category-moderation'])
		}
	})
}

export function useCopyFromLibrary() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: apiCopyFromLibrary,
		onSuccess: () => {
			queryClient.invalidateQueries(['instances'])
			queryClient.invalidateQueries(['community-library'])
		}
	})
}

export function useToggleLike() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: apiToggleLike,
		onSuccess: () => {
			queryClient.invalidateQueries(['community-library'])
		}
	})
}

export function useReportEntry() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ entryId, data }) => apiReportEntry(entryId, data),
		onSuccess: () => {
			queryClient.invalidateQueries(['community-library'])
		}
	})
}

export function usePublishToLibrary() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ instId, data }) => apiPublishToLibrary(instId, data),
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries(['community-library'])
			variables.successFunc(data.entry)
		},
		onError: (err, variables, context) => {
			variables.errorFunc(err)
		}
	})
}

export function useUnpublishFromLibrary() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: apiUnpublishFromLibrary,
		onSuccess: () => {
			queryClient.invalidateQueries(['community-library'])
		}
	})
}

export function useUpdateInLibrary() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: apiUpdateInLibrary,
		onSuccess: () => {
			queryClient.invalidateQueries(['community-library'])
		}
	})
}

export function usePullFromLibrary() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: apiPullFromLibrary,
		onSuccess: () => {
			queryClient.invalidateQueries(['instances'])
		}
	})
}
