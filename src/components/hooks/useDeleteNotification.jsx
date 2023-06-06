import { useMutation, useQueryClient } from 'react-query'
import { apiDeleteNotification } from '../../util/api'

export default function useDeleteNotification() {
	const queryClient = useQueryClient()

	return useMutation(
		apiDeleteNotification,
		{
			// Handles the optomistic update for deleting a Notification
			onMutate: async data => {
				await queryClient.cancelQueries('notifications')

				const previousValue = queryClient.getQueryData('notifications')

				if (data.deleteAll)
				{
					queryClient.setQueryData('notifications', [])
				}
				else
				{
					queryClient.setQueryData('notifications', old => old.filter(notif => notif.id != data.delID))
				}

				// Stores the old value for use if there is an error
				return { previousValue }
			},
			onSuccess: (data, variables) => {
				// queryClient.invalidateQueries('notifications')
				if (data) variables.successFunc(data);
			},
			onError: (err, newWidget, context) => {
				queryClient.setQueryData('notifications', context.previousValue)
			}
		}
	)
}
