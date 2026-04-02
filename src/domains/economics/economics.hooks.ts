import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchPayments,
  fetchFinancials,
  fetchPaymentSummary,
  createPayment,
  updatePayment,
  deletePayment,
  upsertFinancials,
} from './economics.queries'
import type { PaymentFormData, FinancialsFormData } from '@/lib/types'

export const economicsKeys = {
  payments: (eventId: string) => ['economics', 'payments', eventId] as const,
  financials: (eventId: string) => ['economics', 'financials', eventId] as const,
  summary: (eventId: string) => ['economics', 'summary', eventId] as const,
}

export function usePayments(eventId: string) {
  return useQuery({
    queryKey: economicsKeys.payments(eventId),
    queryFn: () => fetchPayments(eventId),
    enabled: !!eventId,
  })
}

export function useFinancials(eventId: string) {
  return useQuery({
    queryKey: economicsKeys.financials(eventId),
    queryFn: () => fetchFinancials(eventId),
    enabled: !!eventId,
  })
}

export function usePaymentSummary(eventId: string) {
  return useQuery({
    queryKey: economicsKeys.summary(eventId),
    queryFn: () => fetchPaymentSummary(eventId),
    enabled: !!eventId,
  })
}

export function useUpsertFinancials(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: FinancialsFormData) => upsertFinancials(eventId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: economicsKeys.financials(eventId) })
      void qc.invalidateQueries({ queryKey: economicsKeys.summary(eventId) })
    },
  })
}

export function useCreatePayment(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PaymentFormData) => createPayment(eventId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: economicsKeys.payments(eventId) })
      void qc.invalidateQueries({ queryKey: economicsKeys.summary(eventId) })
    },
  })
}

export function useUpdatePayment(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PaymentFormData> }) =>
      updatePayment(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: economicsKeys.payments(eventId) })
      void qc.invalidateQueries({ queryKey: economicsKeys.summary(eventId) })
    },
  })
}

export function useDeletePayment(eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePayment(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: economicsKeys.payments(eventId) })
      void qc.invalidateQueries({ queryKey: economicsKeys.summary(eventId) })
    },
  })
}
