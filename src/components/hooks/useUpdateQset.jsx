import { useMutation, useQueryClient } from 'react-query'
import { apiUpdateQset } from '../../util/api'

export default function useUpdateQset() {
	return useMutation(
		apiUpdateQset,
		{
			onSuccess: (updatedInst, variables) => {
				variables.successFunc(updatedInst)
			},
			onError: (err, variables) => {
				variables.errorFunc(err)
			}
		}
	)
}
