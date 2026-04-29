import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiUpdateUserSettings } from '../../util/api'

export default function useUpdateUserSettings() {

	const queryClient = useQueryClient()

	return useMutation(
		{
			mutationFn: apiUpdateUserSettings,
			onMutate: async settings => {
				await queryClient.cancelQueries({ queryKey: ['user', 'me'] })

				// Merge new profile_field settings
				const val = {
					...queryClient.getQueryData(['user', 'me']),
					profile_fields: settings.profile_fields
				}
				const previousValue = queryClient.getQueryData(['user', 'me'])

				// Cache current and return old for use if needed
				queryClient.setQueryData(['user', 'me'], () => val)
				return { previousValue }
			},
			onSuccess: (data, variables, context) => {
				queryClient.invalidateQueries({
					queryKey: ['user', 'me']
				})
				variables.successFunc(data)
			},
			onError: (err, variables, context) => {
				variables.errorFunc(err)
				queryClient.setQueryData(['user', 'me'], context.previousValue)
			}
		}
	)
}