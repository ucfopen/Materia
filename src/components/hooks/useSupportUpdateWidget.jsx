import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiUpdateWidgetInstance } from '../../util/api'

export default function useSupportUpdateWidget() {
	const queryClient = useQueryClient()

	// Optimistically updates the cache value on mutate
	return useMutation(
		{
			mutationFn: apiUpdateWidgetInstance,
			onSuccess: (data, variables) => {
				// Refresh widgets
				queryClient.invalidateQueries({
					queryKey: ['widgets']
				})

				queryClient.removeQueries({
					queryKey: ['search-widgets'],
					exact: false
				})

				variables.successFunc()
			},
			onError: (error, variables, context) => {
				queryClient.setQueryData(['widgets'], context.previousValue)
				variables.errorFunc()
			}
		}
	)
}
