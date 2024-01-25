import { useMutation, useQueryClient } from 'react-query'
import { apiDeleteWidget } from '../../util/api'

export default function useDeleteWidget() {
	const queryClient = useQueryClient()

	return useMutation(
		apiDeleteWidget,
		{
			// Handles the optimistic update for deleting a widget
			onMutate: async inst => {
				await queryClient.cancelQueries('widgets')
				const previousValue = queryClient.getQueryData('widgets')

				queryClient.setQueryData('widgets', previous => {
					if (!previous || !previous.pages) return previous
					return {
						...previous,
						pages: previous.pages.map((page) => ({
							...page,
							pagination: page.pagination.filter(widget => widget.id !== inst.instId)
						})),
						modified: Math.floor(Date.now() / 1000)
					}
				})

				// Stores the old value for use if there is an error
				return { previousValue }
			},
			onSuccess: (data, variables) => {
				variables.successFunc(data)
			},
			onError: (err, newWidget, context) => {
				console.error(err)
				queryClient.setQueryData('widgets', (previous) => {
					return context.previousValue
				})
			}
		}
	)
}
