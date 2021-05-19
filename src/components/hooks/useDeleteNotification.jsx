import { useMutation, useQueryClient } from 'react-query'
import fetchOptions from '../../util/fetch-options'

async function deleteNotificationFetch(notifId) {
	await fetch('/api/json/notification_delete/', fetchOptions({body: "data=" + encodeURIComponent(`[${notifId}]`)}))
	.then((resp) => resp.json())
}

export default function useDeleteNotification() {
	const queryClient = useQueryClient()

	return useMutation(
		deleteNotificationFetch,
		{
			// Handles the optomistic update for deleting a Notification
			onMutate: async delID => {
        await queryClient.cancelQueries('notifications')

				const previousValue = queryClient.getQueryData('notifications')

        queryClient.setQueryData('notifications', old => old.filter(notif => notif.id != delID))

				// Stores the old value for use if there is an error
        return { previousValue }
			},
			onSuccess: () => {
				queryClient.invalidateQueries('notifications')
			},
			onError: (err, newWidget, context) => {
				queryClient.setQueryData('notifications', context.previousValue)
			}
		}
	)
}
