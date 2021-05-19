import { useMutation, useQueryClient } from 'react-query'
import fetchOptions from '../../util/fetch-options'

async function deleteWidgetFetch({instId}) {
	await fetch('/api/json/widget_instance_delete/', fetchOptions({body:`data=%5B%22${instId}%22%5D`}))
	.then((resp) => {
		console.log(resp)
		if (resp.status === 502) return null
		return resp.json()
	})
}

export default function useSupportDeleteWidget() {
	const queryClient = useQueryClient()

	return useMutation(
		deleteWidgetFetch,
		{
			onSuccess: (data, variables) => {
				if (data !== null) {
					variables.successFunc()
					queryClient.removeQueries('search-widgets', {
						exact: false
					})
				}
				else {
					console.log('failed to delete widget')
				}
			},
			onError: () => {
				console.log('Failed to delete widget on backend')
			}
		}
	)
}
