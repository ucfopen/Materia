import { useMutation, useQueryClient } from 'react-query'
import { apiUpdateWidget } from '../../util/api'

export default function useUpdateWidget() {
	const queryClient = useQueryClient()

	let widgetList = null

	// Optimistically updates the cache value on mutate
	return useMutation(
		apiUpdateWidget,
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
					for (const inst of page?.pagination) {
						if (inst.id === variables.args[0]) {
							inst.open_at = parseInt(variables.args[4])
							inst.close_at = parseInt(variables.args[5])
							inst.attempts = parseInt(variables.args[6])
							inst.guest_access = variables.args[7]
							inst.embedded_only = variables.args[8]
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
				queryClient.setQueryData('widgets', previous)
				variables.successFunc(null)
			}
		}
	)
}
