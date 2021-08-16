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

				const copyValue = [...queryClient.getQueryData('widgets')]
				const previousValue = queryClient.getQueryData('widgets')

				for (const val of copyValue) {
					if (val.id === inst.args[0]) {
						val.open_at = `${inst.args[4]}`
						val.close_at = `${inst.args[5]}`
						val.attempts = `${inst.args[6]}`
						val.guest_access = inst.args[7]
						val.embedded_only = inst.args[8]
					}
				}

				queryClient.setQueryData('widgets', () => copyValue)

				// Stores the old value for use if there is an error
				return { previousValue }
			},
			onSuccess: (data, variables) => {
				variables.successFunc()
				queryClient.invalidateQueries('widgets')
				queryClient.invalidateQueries(['user-perms', variables.args[0]])
			},
			onError: (err, newWidget, context) => {
				queryClient.setQueryData('widgets', context.previousValue)
			}
		}
	)
}
