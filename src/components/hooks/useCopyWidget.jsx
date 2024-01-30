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
			onSuccess: (data, variables) => {
				if (queryClient.getQueryData('widgets'))
				{
					// optimistically update the query cache with the new instance info
					queryClient.setQueryData('widgets', (previous) => ({
						...previous,
						pages: previous.pages.map((page, index) => {
							if (index == 0) return { ...page, pagination: [ data, ...page.pagination] }
							else return page
						}),
						modified: Math.floor(Date.now() / 1000)
					}))
				}
			},
			onError: (err, variables, context) => {
				variables.errorFunc(err)
				queryClient.setQueryData('widgets', (previous) => {
					return context.previousValue
				})
			}
		}
	)
}
