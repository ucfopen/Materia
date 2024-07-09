import { useMutation } from 'react-query'
import { apiSavePlayStorage } from '../../util/api'

export default function usePlayStorageDataSave() {
	return useMutation(
		apiSavePlayStorage,
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
