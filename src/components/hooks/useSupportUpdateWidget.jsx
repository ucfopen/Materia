import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiUpdateWidgetInstance } from '../../util/api'

export default function useSupportUpdateWidget() {
	const queryClient = useQueryClient()

	// TODO: Optimistically updates the cache value on mutate?
	return useMutation(
		{
			mutationFn: apiUpdateWidgetInstance,
			onSuccess: (data, variables) => {
				queryClient.invalidateQueries({
					queryKey: ['widgets']
				})

				queryClient.removeQueries({
					queryKey: ['search-widgets'],
					exact: false
				})

				variables.successFunc(data)
			},
			onError: (err, variables, context) => {
				variables.errorFunc(err)
			}
		}
	)
}
