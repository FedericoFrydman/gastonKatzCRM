import type { EventStatus, PaymentStatus, PaymentType } from '@/lib/database.types'

// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface Place {
  id: string
  name: string
  address: string
  clarification: string | null
  createdAt: string
  updatedAt: string
}

export interface Event {
  id: string
  name: string
  date: string
  startTime: string
  endTime: string | null
  placeId: string | null
  place?: Place
  description: string | null
  whatsapp: string | null
  email: string | null
  ages: string | null
  status: EventStatus
  includesLightingBudget: boolean
  imageUrl: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface EventPayment {
  id: string
  eventId: string
  amount: number
  type: PaymentType
  notes: string | null
  paymentDate: string
  createdAt: string
}

export interface EventFinancials {
  id: string
  eventId: string
  totalAmount: number
  createdAt: string
  updatedAt: string
}

export interface EventPaymentSummary {
  eventId: string
  totalAmount: number | null
  totalPaid: number | null
  balance: number | null
  paymentStatus: PaymentStatus | null
}

// ─── Status helpers ────────────────────────────────────────────────────────────

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  confirmed: 'Confirmado',
  query: 'Solo consulta',
  budget_pending: 'Por mandar presupuesto',
  reserved: 'Reservado',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'Sin pagos',
  partial: 'Pago parcial',
  paid: 'Pago completo',
}

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  total: 'Total',
  partial: 'Parcial',
}

// ─── Form types ───────────────────────────────────────────────────────────────

export type PlaceFormData = {
  name: string
  address: string
  clarification?: string
}

export type EventFormData = {
  name: string
  date: string
  startTime: string
  endTime?: string
  placeId?: string
  description?: string
  whatsapp?: string
  email?: string
  ages?: string
  status: EventStatus
  includesLightingBudget: boolean
  image?: File
}

export type PaymentFormData = {
  amount: number
  type: PaymentType
  notes?: string
  paymentDate: string
}

export type FinancialsFormData = {
  totalAmount: number
}

// ─── Filter types ─────────────────────────────────────────────────────────────

export type EventSortBy = 'date' | 'status' | 'created'

export type EventFilters = {
  search?: string
  status?: EventStatus | ''
  placeId?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: EventSortBy
  page?: number
  pageSize?: number
}
