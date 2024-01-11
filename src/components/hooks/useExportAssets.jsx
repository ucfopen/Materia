import { useMutation, useQueryClient } from 'react-query'
import { apiGetAssetsForWidget } from '../../util/api'

/**
 * @returns The mutation function and the result of the mutation
 */
export default function useExportAssets() {
	const queryClient = useQueryClient()

	return useMutation(
		apiGetAssetsForWidget,
		{
			onSuccess: (data, variables) => {
				variables.successFunc(data)
			},
			onError: (err, newWidget, context) => {
                console.error(err)
			}
		}
	)
}
