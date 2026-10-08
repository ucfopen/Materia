import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiCopyWidget } from '../../util/api'

export default function useSupportCopyWidget() {
	const queryClient = useQueryClient()

	return useMutation(
		{
			mutationFn: apiCopyWidget,
			onSuccess: (data, variables) => {
				variables.successFunc(data)
				queryClient.removeQueries({
					queryKey: ['search-widgets'],
					exact: false
				})
			},
			onError: (data, variables) => {
				variables.errorFunc(data)
				console.error('Failed to copy widget: ' + err.cause)
			}
		}
	)
}
