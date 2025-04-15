import { useMutation, useQueryClient } from 'react-query'
import { apiUpdateWidgetInstance } from '../../util/api'

export default function useSupportUpdateWidget() {
	const queryClient = useQueryClient()

	// Optimistically updates the cache value on mutate
	return useMutation(
		apiUpdateWidgetInstance,
		{
			onSuccess: (data, variables) => {
				// Refresh widgets
				queryClient.invalidateQueries('widgets')

				queryClient.removeQueries('search-widgets', {
					exact: false
				})

				variables.successFunc()
			},
			onError: (err, variables, context) => {
				queryClient.setQueryData('widgets', context.previousValue)

				variables.errorFunc(err)
			}
		}
	)
}
