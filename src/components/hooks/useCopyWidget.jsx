import { useMutation, useQueryClient } from 'react-query'
import { apiCopyWidget } from '../../util/api'

/**
 * It optimistically updates the cache value on mutate
 * @returns The mutation function and the result of the mutation
 */
export default function useCopyWidget() {
	const queryClient = useQueryClient()

	// Optimistically updates the cache value on mutate
	return useMutation(
		apiCopyWidget,
		{
			onMutate: async inst => {
				await queryClient.cancelQueries('widgets', { exact: true, active: true, })
				const previousValue = queryClient.getQueryData('widgets')

				// dummy data that's appended to the query cache as an optimistic update
				// this will be replaced with actual data returned from the API
				const newInst = {
					id: 'tmp',
					widget: {
						name: inst.widgetName,
						dir: inst.dir
					},
					name: inst.title,
					is_draft: false,
					is_fake: true
				}

				// setQueryClient must treat the query cache as immutable!!!
				// previous will contain the cached value, the function argument creates a new object from previous
				queryClient.setQueryData('widgets', (previous) => ({
					...previous,
					pages: previous.pages.map((page, index) => {
						if (index == 0) return { ...page, pagination: [ newInst, ...page.pagination] }
						else return page
					}),
					modified: Math.floor(Date.now() / 1000)
				}))

				return { previousValue }
			},
			onSuccess: (data, variables) => {
				// update the query cache, which previously contained a dummy instance, with the real instance info
				queryClient.setQueryData('widgets', (previous) => ({
					...previous,
					pages: previous.pages.map((page, index) => {
						if (index == 0) return { ...page, pagination: page.pagination.map((inst) => {
							if (inst.id == 'tmp') inst = data
							return inst
						}) }
						else return page
					}),
					modified: Math.floor(Date.now() / 1000)
				}))
				variables.successFunc(data)
			},
			onError: (err, newWidget, context) => {
				console.error(err)
				queryClient.setQueryData('widgets', (previous) => {
					return context.previousValue
				})
			}
		}
	)
}
