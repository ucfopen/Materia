import { useMutation, useQueryClient } from 'react-query'
import { apiUpdateWidgetInstance } from '../../util/api'

export default function useUpdateWidget() {
	const queryClient = useQueryClient()

	let widgetList = null

	// Optimistically updates the cache value on mutate
	return useMutation(
		apiUpdateWidgetInstance,
		{
			onMutate: async formData => {
				// cancel any in-progress queries and grab the current query cache for widgets
				await queryClient.cancelQueries('widgets')
				widgetList = queryClient.getQueryData('widgets')

				// widgetList is passed to onSuccess or onError depending on resolution of mutation function
				return { ...widgetList }
			},
			onSuccess: (updatedInst, variables) => {
				// update successful - insert new values into our local copy of widgetList
				for (const page of widgetList?.pages) {
					for (const inst of page?.results) {
						if (inst.id === variables.instId) {
							inst.open_at = parseInt(variables.openAt)
							inst.close_at = parseInt(variables.closeAt)
							inst.attempts = parseInt(variables.attempts)
							inst.guest_access = variables.guestAccess
							inst.embedded_only = variables.embeddedOnly
							break
						}
					}
				}
				// update query cache for widgets. This does NOT invalidate the cache, forcing a re-fetch!!
				queryClient.setQueryData('widgets', previous => {
					return {
						...widgetList,
						modified: Math.floor(Date.now() / 1000)
					}
				})

				queryClient.invalidateQueries(['user-perms', variables.args[0]])

				variables.successFunc(updatedInst)
			},
			onError: (err, variables, previous) => {
				// write previously intact widget list into the query cache. This should be the same data as before.
				variables.errorFunc(err)
			}
		}
	)
}
