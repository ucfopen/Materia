import { useMutation, useQueryClient } from 'react-query'
import { apiDeleteWidget } from '../../util/api'

export default function useDeleteWidget() {
	const queryClient = useQueryClient()

	return useMutation(
		apiDeleteWidget,
		{
			// Handles the optomistic update for deleting a widget
			onMutate: async inst => {
				await queryClient.cancelQueries('widgets')

				const previousValue = queryClient.getQueryData('widgets')
				const delID = inst.instId

				queryClient.setQueryData('widgets', old => old.filter(widget => widget.id !== delID))

				// Stores the old value for use if there is an error
				return { previousValue }
			},
			onSuccess: () => {
				queryClient.invalidateQueries('widgets')
			},
			onError: (err, newWidget, context) => {
				queryClient.setQueryData('widgets', context.previousValue)
			}
		}
	)
}
