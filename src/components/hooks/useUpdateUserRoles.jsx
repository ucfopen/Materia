import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiUpdateUserRoles } from '../../util/api'

export default function useUpdateUserRoles() {

	const queryClient = useQueryClient()

	// @todo: Optimistically updates the cache value on mutate?
	return useMutation(
		{
			mutationFn: apiUpdateUserRoles,
			onMutate: async roles => {
				// @todo: this block does nothing
				await queryClient.cancelQueries({ queryKey: ['search-users']})

				const val = {...queryClient.getQueryData(['search-users'])}
				const previousValue = queryClient.getQueryData(['search-users'])

				queryClient.setQueryData(['search-users'], () => val)

				return { previousValue }
			},
			onSuccess: (data, variables, context) => {
				queryClient.invalidateQueries({
					queryKey: ['search-users']
				})
				variables.successFunc(data)
			},
			onError: (err, variables, context) => {
				queryClient.setQueryData(['search-users'], context.previousValue)
				variables.errorFunc(err)
			}
		}
	)
}