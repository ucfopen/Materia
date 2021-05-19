import { useQuery } from 'react-query'
import fetchOptions from '../../util/fetch-options'

export async function fetchWidget(widgetQuery) {
	const widgetId = 'nOXya'
	fetch('/api/json/widget_instances_get/', fetchOptions({body: 'data=' + encodeURIComponent(`["${widgetId}"]`)}))
	.then((res) => {
		if (res.ok === true) return res.json()
		return []
	})
	.then(data => {
		return data
	})
	.catch(error => {
		console.log(`Failed to fetch widget ${widgetId}`)
		return {error: `Failed to fetch widget ${widgetId}`}
	})
}

export default function useWidget(widgetId) {
	return useQuery(['widgets', widgetId], fetchWidget)
}
