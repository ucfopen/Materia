import { useMutation, useQueryClient } from 'react-query'
import { apiUpdateWidget } from '../../util/api'

export default function useUpdateWidget() {
	const queryClient = useQueryClient()

	// Optimistically updates the cache value on mutate
	return useMutation(
		apiUpdateWidget,
		{
			onMutate: async inst => {
				await queryClient.cancelQueries('widgets')

				const previousWidgets = queryClient.getQueryData('widgets')

				if (previousWidgets) {
					for (const val of previousWidgets.pagination) {
						if (val.id === inst.args[0]) {
							val.name = inst.args[1]
							val.open_at = `${inst.args[4]}`
							val.close_at = `${inst.args[5]}`
							val.attempts = `${inst.args[6]}`
							val.guest_access = inst.args[7]
							val.embedded_only = inst.args[8]
						}
					}
					queryClient.setQueryData('widgets', previousWidgets)
				}

				// Stores the old value for use if there is an error
				return { previousWidgets }
			},
			onSuccess: (updatedInst, variables) => {
				variables.successFunc(updatedInst)
				queryClient.invalidateQueries('widgets')
				queryClient.invalidateQueries(['user-perms', variables.args[0]])
			},
			onError: (err, newWidget, context) => {
				queryClient.setQueryData('widgets', context.previousValue)
			}
		}
	)
}
