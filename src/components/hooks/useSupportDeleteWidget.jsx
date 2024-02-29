import { useMutation, useQueryClient } from 'react-query'
import { apiDeleteWidget } from '../../util/api'

export default function useSupportDeleteWidget() {
	const queryClient = useQueryClient()

	return useMutation(
		apiDeleteWidget,
		{
			onSuccess: (data, variables) => {
				if (!!data) {
					variables.successFunc()
					queryClient.invalidateQueries('widgets')
				}
				else {
					console.error('failed to delete widget')
				}
			},
			onError: () => console.error('Failed to delete widget on backend')
		}
	)
}
