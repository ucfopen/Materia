import { useMutation, useQueryClient } from 'react-query'
import { apiUpdateUserSettings } from '../../util/api'

export default function useUpdateUserSettings() {

	const queryClient = useQueryClient()

	return useMutation(
		apiUpdateUserSettings,
		{
			onMutate: async settings => {
				await queryClient.cancelQueries('user')
				const val = {...queryClient.getQueryData('user')}
				const prior = queryClient.getQueryData('user')

				queryClient.setQueryData('user', () => val)

				return { prior }
			},
			onSuccess: (data, variables, context) => {
				variables.successFunc()
				queryClient.invalidateQueries('user')

			},
			onError: (err, variables, context) => {
				variables.errorFunc(err)
				queryClient.setQueryData('user', context.previousValue)
			}
		}
	)
}