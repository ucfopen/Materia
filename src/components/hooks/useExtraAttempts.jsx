import { useMutation } from '@tanstack/react-query'
import {apiCreateExtraAttempts, apiDeleteExtraAttempts, apiUpdateExtraAttempts} from '@/util/api'

export function useCreateExtraAttempts() {
	return useMutation(apiCreateExtraAttempts)
}

export function useDeleteExtraAttempts() {
	return useMutation(apiDeleteExtraAttempts)
}

export function useUpdateExtraAttempts() {
	return useMutation(apiUpdateExtraAttempts)
}
