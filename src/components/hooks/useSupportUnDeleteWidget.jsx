import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiUnDeleteWidget } from '../../util/api'

export default function useSupportUnDeleteWidget() {
	const queryClient = useQueryClient()

	return useMutation(
		{
			mutationFn: apiUnDeleteWidget,
			onSuccess: (data, variables) => {
				variables.successFunc()
				queryClient.removeQueries({
					queryKey: ['search-widgets'],
					exact: false
				})
			},
			onError: (err, variables) => {
				variables.errorFunc(err)
				console.error('Failed to restore widget: ' + err.cause)
			}
		}
	)
}
