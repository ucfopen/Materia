import { useMutation, useQueryClient } from 'react-query'
import { apiCopyWidget } from '../../util/api'

export default function useCopyWidget() {
	const queryClient = useQueryClient()

	// Optimistically updates the cache value on mutate
	return useMutation(
		apiCopyWidget,
		{
			onMutate: async inst => {
				await queryClient.cancelQueries('widgets')
				const previousValue = queryClient.getQueryData('widgets')

				const newInst = {
					id: 'tmp',
					widget: {
						name: inst.widgetName,
						dir: inst.dir
					},
					name: inst.title,
					is_draft: false,
					is_fake: true
				}

				queryClient.setQueryData('widgets', old => [newInst, ...old])

				// Stores the old value for use if there is an error
				return { previousValue }
			},
			onSuccess: () => {
				queryClient.invalidateQueries('widgets')
			},
			onError: (err, newWidget, context) => {
				queryClient.setQueryData('widgets', context.previousValue)
			}
		}
	)
}
