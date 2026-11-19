import { useMutation } from '@tanstack/react-query'
import { apiStreamingResponseGenerate } from '../../util/api'

export default function usePlayerPromptStream() {
	return useMutation({
		mutationFn: (variables) => apiStreamingResponseGenerate(variables),
		onSuccess: (data, variables) => {
			variables.successFunc(data)
		},
		onError: (err, variables) => {
			variables.errorFunc(err)
		}
	})
}