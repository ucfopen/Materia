import { useMutation, useQueryClient } from 'react-query'
import { apiUpdateUserRoles } from '../../util/api'

export default function useUpdateUserRoles() {
	
	const queryClient = useQueryClient()

	return useMutation(
		apiUpdateUserRoles,
		{
			onMutate: async roles => {
				await queryClient.cancelQueries('search-users')
				const val = {...queryClient.getQueryData('search-users')}
				const prior = queryClient.getQueryData('search-users')

				queryClient.setQueryData('search-users', () => val)

				return { prior }
			},
			onSuccess: (data, variables, context) => {
				queryClient.invalidateQueries('search-users')
				variables.successFunc(data)
			},
			onError: (err, newRoles, context) => {
				queryClient.setQueryData('search-users', context.previousValue)
				return err
			}
		}
	)
}