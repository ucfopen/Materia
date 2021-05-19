import { useMutation, useQueryClient } from 'react-query'
import { apiCopyWidget } from '../../util/api'

export default function useSupportCopyWidget() {
	const queryClient = useQueryClient()
	
	// Optimistically updates the cache value on mutate
	return useMutation(
		apiCopyWidget,
		{
			onSuccess: (data, variables) => {
				variables.successFunc(data)
				queryClient.removeQueries('search-widgets', {
					exact: false
				})
			}
		}
	)
}
