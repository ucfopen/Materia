import { useMutation } from 'react-query'
import { apiSetAttempts } from '../../util/api'

export default function useSetAttempts() {
	return useMutation(
		apiSetAttempts,
		{
			onError: () => {
				console.log('failed to update extra attempts')
			}
		}
	)
}
