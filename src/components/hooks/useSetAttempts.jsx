import { useMutation } from 'react-query'

async function setAttemptsFetch({instId, attempts}) {
	await fetch(`/api/admin/extra_attempts/${instId}`, 
	{
		method: 'POST',
		mode: 'cors', 
		credentials: 'include', 
		headers: {
			pragma: "no-cache",
			"cache-control": "no-cache",
			"content-type": "application/json; charset=UTF-8"
		},
		body: JSON.stringify(attempts) 
	})
}

export default function useSetAttempts() {
	return useMutation(
		setAttemptsFetch,
		{
			onError: () => {
				console.log('failed to update extra attempts')
			}
		}
	)
}
