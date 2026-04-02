import type { EventStatus, PaymentStatus } from '@/lib/database.types'
import { EVENT_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<EventStatus, string> = {
  confirmed: 'badge-confirmed',
  query: 'badge-query',
  budget_pending: 'badge-budget',
  reserved: 'badge-reserved',
}

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  unpaid: 'inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-700/40 text-zinc-400 text-xs font-medium rounded-full border border-zinc-700',
  partial: 'badge-reserved',
  paid: 'badge-confirmed',
}

export function EventStatusBadge({
  status,
  className,
}: {
  status: EventStatus
  className?: string
}) {
  return (
    <span className={cn(STATUS_STYLES[status], className)}>
      {EVENT_STATUS_LABELS[status]}
    </span>
  )
}

export function PaymentStatusBadge({
  status,
  className,
}: {
  status: PaymentStatus
  className?: string
}) {
  return (
    <span className={cn(PAYMENT_STATUS_STYLES[status], className)}>
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  )
}
