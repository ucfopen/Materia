import { useMutation, useQueryClient } from 'react-query'
import { apiUnDeleteWidget } from '../../util/api'

export default function useSupportUnDeleteWidget() {
	const queryClient = useQueryClient()

	return useMutation(
		apiUnDeleteWidget,
		{
			onSuccess: (data, variables) => {
				if (data !== null) {
					variables.successFunc()
					queryClient.removeQueries('search-widgets', {
						exact: false
					})
				}
				else {
					console.log('failed to undelete widget')
				}
			},
			onError: () => console.log('Failed to undelete widget on backend')
		}
	)
}
