import { useMutation, useQueryClient } from 'react-query'
import { apiCopyWidget } from '../../util/api'

/**
 * It optimistically updates the cache value on mutate
 * @returns The mutation function and the result of the mutation
 */
export default function useCopyWidget() {
	const queryClient = useQueryClient()

	// Optimistically updates the cache value on mutate
	return useMutation(
		apiCopyWidget,
		{
			onMutate: async inst => {
				await queryClient.cancelQueries('widgets', { exact: true, active: true, })
				// 'getQueryData()' is a sync method
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

				let updateData = previousValue
				updateData.pagination.unshift(newInst)

				// 'setQueryData()' is a sync method
				queryClient.setQueryData('widgets', updateData) // can confirm 'widgets' is updating
				console.log('5) updateData:', updateData.pagination)

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
