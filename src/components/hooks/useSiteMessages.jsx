import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGetSiteMessages } from '../../util/api'

// an empty types array requests all message types
export default function useSiteMessages({ types = [], includeExpired = false, latest = true, enabled = true } = {}) {

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ['site-messages', ...types, { includeExpired, latest }],
		queryFn: () => apiGetSiteMessages(types, includeExpired, latest),
		enabled,
		staleTime: Infinity,
		retry: false,
		refetchOnWindowFocus: false
	})

	const messages = useMemo(() => {
		if (!Array.isArray(data)) return {}
		const map = {}
		data.forEach((msg) => {
			map[msg.message_type] = msg.message_text
		})
		return map
	}, [data])

	return { messages, data, isLoading, error, refetch }
}
