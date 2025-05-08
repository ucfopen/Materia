import { useMutation, useQueryClient } from 'react-query'
import { apiCopyWidget } from '../../util/api'

/**
 * It optimistically updates the cache value on mutate
 * @returns The mutation function and the result of the mutation
 */
export default function useCopyWidget(user) {
	const queryClient = useQueryClient()

	// Optimistically updates the cache value on mutate
	return useMutation(
		apiCopyWidget,
		{
			onSuccess: (data, variables) => {
				if (queryClient.getQueryData(['instances', user]))
				{
					// optimistically update the query cache with the new instance info
					queryClient.setQueryData(['instances', user], (previous) => ({
						...previous,
						pages: previous.pages.map((page, index) => {
							if (index == 0) return { ...page, results: [ data, ...page.results] }
							else return page
						}),
						modified: Math.floor(Date.now() / 1000)
					}))
				}
				variables.successFunc(data)
			},
			onError: (err, variables, context) => {
				variables.errorFunc(err)
				queryClient.setQueryData(['instances', user], (previous) => {
					return context.previousValue
				})
			}
		}
	)
}
