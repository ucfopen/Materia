import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiCopyWidget } from '../../util/api'

export default function useCopyWidget(user) {
	const queryClient = useQueryClient()

	return useMutation(
		{
			mutationFn: apiCopyWidget,
			onSuccess: (data, variables) => {
				// update the query cache with the new instance info
				queryClient.setQueryData(['instances', user], (previous) => {
					if (!previous || !previous.pages) return previous
					return {
						...previous,
						pages: previous.pages.map((page, index) => {
							if (index == 0) return { ...page, results: [data, ...page.results] }
							else return page
						}),
						modified: Math.floor(Date.now() / 1000)
					}
				})

				variables.successFunc(data)

				queryClient.invalidateQueries({ queryKey: ['instances', user] })
			},
			onError: (err, variables, context) => {
				variables.errorFunc(err)
			}
		}
	)
}
