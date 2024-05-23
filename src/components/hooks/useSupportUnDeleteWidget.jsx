import { useMutation, useQueryClient } from 'react-query'
import { apiUnDeleteWidget } from '../../util/api'

export default function useSupportUnDeleteWidget() {
	const queryClient = useQueryClient()

	return useMutation(
		apiUnDeleteWidget,
		{
			onSuccess: (data, variables) => {
				variables.successFunc()
				queryClient.removeQueries('search-widgets', {
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
