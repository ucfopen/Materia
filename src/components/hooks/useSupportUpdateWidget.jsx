import { useMutation, useQueryClient } from 'react-query'
import { apiUpdateWidget } from '../../util/api'

export default function useSupportUpdateWidget() {
	const queryClient = useQueryClient()

	// Optimistically updates the cache value on mutate
	return useMutation(
		apiUpdateWidget,
		{
			onSuccess: (data, variables) => {
				variables.successFunc()

				// Refresh widgets
				queryClient.invalidateQueries('widgets')

				queryClient.removeQueries('search-widgets', {
					exact: false
				})
			},
			onError: (err, newWidget, context) => {
				queryClient.setQueryData('widgets', context.previousValue)

				variables.errorFunc()
			}
		}
	)
}
