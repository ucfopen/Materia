import { useMutation, useQueryClient } from 'react-query'
import { apiDeleteWidget } from '../../util/api'

export default function useSupportDeleteWidget() {
	const queryClient = useQueryClient()

	return useMutation(
		apiDeleteWidget,
		{
			onSuccess: (data, variables) => {
				if (data !== null) {
					variables.successFunc()
					queryClient.removeQueries('search-widgets', {
						exact: false
					})
				}
				else {
					console.log('failed to delete widget')
				}
			},
			onError: () => console.log('Failed to delete widget on backend')
		}
	)
}
