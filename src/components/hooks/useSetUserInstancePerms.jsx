import { useMutation } from 'react-query'
import fetchOptions from '../../util/fetch-options'

async function setUserInstancePermsFetch({instId, permsObj}) {
	await fetch('/api/json/permissions_set', fetchOptions({body: 'data=' + encodeURIComponent(`[4,"${instId}",${JSON.stringify(permsObj)}]`)}))
}

export default function setUserInstancePerms() {
	return useMutation(
		setUserInstancePermsFetch,
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
