import { useMutation } from 'react-query'
import { apiCreatePlaySession } from '../../util/api'


export default function useCreatePlaySession() {
	return useMutation(
		apiCreatePlaySession,
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
