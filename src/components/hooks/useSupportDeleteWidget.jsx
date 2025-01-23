import { useMutation, useQueryClient } from 'react-query'
import { apiDeleteWidget } from '../../util/api'

export default function useSupportDeleteWidget() {
	const queryClient = useQueryClient()

	return useMutation(
		apiDeleteWidget,
		{
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
