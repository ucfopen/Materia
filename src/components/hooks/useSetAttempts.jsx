import { useMutation } from '@tanstack/react-query'
import { apiSetAttempts } from '../../util/api'

export default function useSetAttempts() {
	return useMutation(
		{
			mutationFn: apiSetAttempts,
			onSuccess: (data, variables) => {
				variables.successFunc(data)
			},
			onError: (err, variables) => {
				variables.errorFunc(err)
			}
		}
	)
}
