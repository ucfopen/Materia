import { useMutation } from '@tanstack/react-query'
import { apiSavePlayLogs } from '../../util/api'

export default function usePlayLogSave() {
	return useMutation(
		{
			mutationFn: apiSavePlayLogs,
			onSuccess: (data, variables) => {
				variables.successFunc(data)
			},
			onError: (err, variables) => {
				variables.errorFunc(err)
			}
		}
	)
}
