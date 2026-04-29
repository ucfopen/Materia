import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiDeleteNotification } from '../../util/api'

export default function useDeleteNotification() {
	const queryClient = useQueryClient()

	return useMutation(
		{
			mutationFn: apiDeleteNotification,
			// Handles the optimistic update for deleting a Notification
			onMutate: async data => {
				// Cancel queries that update notification data
				await queryClient.cancelQueries({ queryKey: ['notifications'] })

				// Hold the current notification data
				const previousValue = queryClient.getQueryData(['notifications'])

				// Set it to the expected value
				if (data.deleteAll) {
					queryClient.setQueryData(['notifications'], [])
				}
				else {
					queryClient.setQueryData(['notifications'], old => old.filter(notif => notif.id != data.notifId))
				}

				// Return the data if there is an update
				return { previousValue }
			},
			onSuccess: (data, variables) => {
				// Invalidate the queries. What if we didn't correctly predict output?
				queryClient.invalidateQueries({ queryKey: ['notifications'] })
				variables.successFunc(data);
			},
			onError: (err, variables, context) => {
				variables.errorFunc(err)
				queryClient.setQueryData(['notifications'], context.previousValue)
			}
		}
	)
}
