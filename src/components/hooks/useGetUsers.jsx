import { useMutation, useQueryClient } from 'react-query'
import { apiGetUsers } from '../../util/api'

export default function useGetUsers() {
	const queryClient = useQueryClient()

	return useMutation(
		{
			mutationFn: (variables) => {
				return apiGetUsers(variables.userIds)
			},
			onSuccess: (data, variables) => {
				variables.successFunc(data)
			},
			onError: (err) => {
				variables.errorFunc(err)
			}
		}
	)
}
