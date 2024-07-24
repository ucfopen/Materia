import { useMutation } from 'react-query'
import { apiGetPlaySession } from '../../util/api'


export default function useCreatePlaySession() {
	return useMutation(
		apiGetPlaySession,
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
