import { useMutation, useQueryClient } from 'react-query'
import fetchOptions from '../../util/fetch-options'

async function unDeleteWidgetFetch({instId}) {
	/*
	const options = {
		"headers": {
			"cache-control": "no-cache",
			"pragma": "no-cache",
			"Content-Type": "application/json",
    	"Authorization": "this-can-be-anything",
		},
		"body": `data=%5B%22${instId}%22%5D`,
		"method": "POST",
		"mode": "cors",
		"credentials": "include"
	}
	*/
	await fetch('/api/json/widget_instance_undelete/', fetchOptions({body:`data=%5B%22${instId}%22%5D`}))
	.then((resp) => {
		if (resp.status === 502) return null
			return resp.json()
	})
	.then(res => {
		if (typeof res === 'object' && res?.type === 'error') return Promise.reject('Failed to undelete widget');
		return res
	})
}

export default function useSupportUnDeleteWidget() {
	const queryClient = useQueryClient()

	return useMutation(
		unDeleteWidgetFetch,
		{
			onSuccess: (data, variables) => {
				if (data !== null) {
					variables.successFunc()
					queryClient.removeQueries('search-widgets', {
						exact: false
					})
				}
				else {
					console.log('failed to undelete widget')
				}
			},
			onError: () => {
				console.log('Failed to undelete widget on backend')
			}
		}
	)
}
