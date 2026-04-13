import { useMutation } from '@tanstack/react-query'
import { apiSetUserInstancePerms } from '../../util/api'

export default function setUserInstancePerms() {
	return useMutation(
		{
			mutationFn: apiSetUserInstancePerms,
			onSuccess: (data, variables) =>
			{
				variables.successFunc(data)
			},
			onError: (err, variables) => {
				variables.errorFunc(err)
			}
		}
	)
}
