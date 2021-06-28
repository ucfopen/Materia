import { useMutation } from 'react-query'
import { apiSetUserInstancePerms } from '../../util/api'

export default function setUserInstancePerms() {
	return useMutation(
		apiSetUserInstancePerms,
		{
			onSuccess: (data, variables) => {
				variables.successFunc()
			},
			onError: () => {
				console.log('failed to update extra attempts')
			}
		}
	)
}
