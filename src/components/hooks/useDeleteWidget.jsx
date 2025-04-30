import { useMutation, useQueryClient } from 'react-query'
import { apiDeleteWidget } from '../../util/api'
import { useState } from 'react'

export default function useDeleteWidget() {
	const queryClient = useQueryClient()

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
							results: page.results.filter(widget => widget.id !== variables['instId'])
						})),
						modified: Math.floor(Date.now() / 1000)
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
