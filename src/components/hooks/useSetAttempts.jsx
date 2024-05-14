import { useMutation } from 'react-query'
import { apiSetAttempts } from '../../util/api'

export default function useSetAttempts() {
	return useMutation(
		apiSetAttempts,
		{
			onSuccess: (data, variables) => {
				variables.successFunc(data)
			},
			onError: (err, variables) => {
				variables.errorFunc(err)
			}
		}
	)
}
