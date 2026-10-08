import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiDeleteWidget } from '../../util/api'
import { useState } from 'react'

export default function useDeleteWidget(user) {
	const queryClient = useQueryClient()

	return useMutation(
		{
			mutationFn: apiDeleteWidget,
			onMutate: async data => {
				await queryClient.cancelQueries({ queryKey: ['instances', user] })

				const previousValue = queryClient.getQueriesData(['instances', user])

				queryClient.setQueryData(['instances', user], previous => {
					if (!previous || !previous.pages) return previous
					return {
						...previous,
						pages: previous.pages.map((page) => ({
							...page,
							results: page.results.filter(widget => widget.id !== data['instId'])
						})),
						modified: Math.floor(Date.now() / 1000)
					}
				})

				return { previousValue }
			},
			onSuccess: (data, variables) => {
				queryClient.invalidateQueries({ queryKey: ['instances', user] })
				variables.successFunc(data)
			},
			onError: (err, variables, context) => {
				variables.errorFunc(err)
				queryClient.setQueryData(['instances', user], context.previousValue)
			}
		}
	)
}
