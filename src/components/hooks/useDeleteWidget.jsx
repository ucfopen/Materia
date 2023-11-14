import { useMutation, useQueryClient } from 'react-query'
import { apiDeleteWidget } from '../../util/api'
import { useState } from 'react'

export default function useDeleteWidget() {
	const queryClient = useQueryClient()
	const [instId, setInstId] = useState('')

	return useMutation(
		apiDeleteWidget,
		{
			onSuccess: (data, variables) => {
				// Optimistic update for deleting a widget
				queryClient.setQueryData('widgets', previous => {
					if (!previous || !previous.pages) return previous
					return {
						...previous,
						pages: previous.pages.map((page) => ({
							...page,
							pagination: page.pagination.filter(widget => widget.id !== data)
						}))
					}
				})
				variables.successFunc(data)
			},
			onError: (err, variables, context) => {
				variables.errorFunc(err)
				queryClient.setQueryData('widgets', (previous) => {
					return context.previousValue
				})
			}
		}
	)
}
