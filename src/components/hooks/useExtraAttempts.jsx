import { useMutation } from '@tanstack/react-query'
import {apiCreateExtraAttempts, apiDeleteExtraAttempts, apiUpdateExtraAttempts} from '@/util/api'

export function useCreateExtraAttempts() {
	return useMutation({ mutationFn: apiCreateExtraAttempts })
}

export function useDeleteExtraAttempts() {
	return useMutation({ mutationFn: apiDeleteExtraAttempts })
}

export function useUpdateExtraAttempts() {
	return useMutation({ mutationFn: apiUpdateExtraAttempts })
}
