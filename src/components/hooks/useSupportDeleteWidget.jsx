import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiDeleteWidget } from '../../util/api'

export default function useSupportDeleteWidget() {
	const queryClient = useQueryClient()

	return useMutation(
		{
			mutationFn: apiDeleteWidget,
			onSuccess: (data, variables) => {
				variables.successFunc()
				queryClient.invalidateQueries('widgets')
			},
			onError: (err, variables) => {
				variables.errorFunc(err)
				console.error('Failed to delete widget: ' + err.cause)
			}
		}
	)
}
