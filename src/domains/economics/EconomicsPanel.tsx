import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, DollarSign, TrendingDown } from 'lucide-react'
import {
  usePayments,
  useFinancials,
  usePaymentSummary,
  useCreatePayment,
  useUpdatePayment,
  useDeletePayment,
  useUpsertFinancials,
} from './economics.hooks'
import { Modal } from '@/shared/Modal'
import { PaymentStatusBadge } from '@/shared/StatusBadge'
import type { PaymentFormData, FinancialsFormData } from '@/lib/types'
import { PAYMENT_TYPE_LABELS } from '@/lib/types'
import type { PaymentType } from '@/lib/database.types'
import { paymentSchema, financialsSchema } from '@/lib/validations'
import { formatCurrency, formatDate } from '@/lib/utils'

export function EconomicsPanel({ eventId }: { eventId: string }) {
  const { data: financials } = useFinancials(eventId)
  const { data: summary } = usePaymentSummary(eventId)
  const { data: payments = [] } = usePayments(eventId)
  const [editTotal, setEditTotal] = useState(false)
  const [addPayment, setAddPayment] = useState(false)
  const [editPayment, setEditPayment] = useState<{ id: string } & PaymentFormData | null>(null)

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          label="Total pactado"
          value={financials ? formatCurrency(financials.totalAmount) : '—'}
          accent="zinc"
          action={
            <button
              className="btn-ghost text-xs p-1"
              onClick={() => { setEditTotal(true) }}
              title="Editar monto total"
            >
              <Pencil size={12} />
            </button>
          }
        />
        <SummaryCard
          label="Cobrado"
          value={summary?.totalPaid != null ? formatCurrency(summary.totalPaid) : '—'}
          accent="green"
        />
        <SummaryCard
          label="Saldo"
          value={summary?.balance != null ? formatCurrency(summary.balance) : '—'}
          accent={summary?.balance ? 'amber' : 'green'}
          sub={summary?.paymentStatus ? <PaymentStatusBadge status={summary.paymentStatus} /> : undefined}
        />
      </div>

      {/* Payments list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Pagos ({payments.length})
          </h3>
          <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => { setAddPayment(true) }}>
            <Plus size={14} />
            Registrar pago
          </button>
        </div>

        {!payments.length ? (
          <div className="rounded-lg border border-surface-border bg-surface p-5 text-center text-zinc-600 text-sm">
            <TrendingDown size={22} className="mx-auto mb-2 opacity-40" />
            Sin pagos registrados
          </div>
        ) : (
          <AnimatePresence>
            {payments.map((payment) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center gap-3 py-2.5 border-b border-surface-border last:border-0 group"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                  <DollarSign size={14} className="text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-100 text-sm">
                      {formatCurrency(payment.amount)}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {PAYMENT_TYPE_LABELS[payment.type]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>{formatDate(payment.paymentDate, 'dd/MM/yyyy')}</span>
                    {payment.notes && (
                      <>
                        <span>·</span>
                        <span className="truncate max-w-[180px]">{payment.notes}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="btn-ghost p-1.5"
                    onClick={() => {
                      setEditPayment({
                        id: payment.id,
                        amount: payment.amount,
                        type: payment.type,
                        notes: payment.notes ?? undefined,
                        paymentDate: payment.paymentDate,
                      })
                    }}
                  >
                    <Pencil size={13} />
                  </button>
                  <DeletePaymentButton paymentId={payment.id} eventId={eventId} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Modals */}
      <EditTotalModal
        open={editTotal}
        onClose={() => { setEditTotal(false) }}
        eventId={eventId}
        current={financials?.totalAmount}
      />
      <PaymentFormModal
        open={addPayment}
        onClose={() => { setAddPayment(false) }}
        eventId={eventId}
        mode="create"
      />
      {editPayment && (
        <PaymentFormModal
          open={!!editPayment}
          onClose={() => { setEditPayment(null) }}
          eventId={eventId}
          mode="edit"
          paymentId={editPayment.id}
          initialData={editPayment}
        />
      )}
    </div>
  )
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  accent,
  sub,
  action,
}: {
  label: string
  value: string
  accent: 'zinc' | 'green' | 'amber'
  sub?: React.ReactNode
  action?: React.ReactNode
}) {
  const accentColors = {
    zinc: 'text-zinc-100',
    green: 'text-green-400',
    amber: 'text-amber-400',
  }

  return (
    <div className="bg-surface rounded-lg border border-surface-border p-3 space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
        {action}
      </div>
      <p className={`text-lg font-bold ${accentColors[accent]}`}>{value}</p>
      {sub && <div>{sub}</div>}
    </div>
  )
}

// ─── Edit Total Modal ─────────────────────────────────────────────────────────

function EditTotalModal({
  open,
  onClose,
  eventId,
  current,
}: {
  open: boolean
  onClose: () => void
  eventId: string
  current?: number
}) {
  const upsert = useUpsertFinancials(eventId)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FinancialsFormData>({
    resolver: zodResolver(financialsSchema),
    defaultValues: { totalAmount: current },
  })

  const onSubmit = async (data: FinancialsFormData) => {
    await upsert.mutateAsync(data)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Monto total del evento" size="sm">
      <form onSubmit={(e) => { void handleSubmit(onSubmit)(e) }} className="space-y-4">
        <div>
          <label className="label-base">Monto pactado (ARS) *</label>
          <input
            type="number"
            {...register('totalAmount', { valueAsNumber: true })}
            className="input-base"
            placeholder="Ej: 150000"
            min={0}
          />
          {errors.totalAmount && (
            <p className="text-red-400 text-xs mt-1">{errors.totalAmount.message}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1 justify-center" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary flex-1 justify-center" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Payment Form Modal ───────────────────────────────────────────────────────

function PaymentFormModal({
  open,
  onClose,
  eventId,
  mode,
  paymentId,
  initialData,
}: {
  open: boolean
  onClose: () => void
  eventId: string
  mode: 'create' | 'edit'
  paymentId?: string
  initialData?: Partial<PaymentFormData>
}) {
  const createPayment = useCreatePayment(eventId)
  const updatePayment = useUpdatePayment(eventId)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      type: 'partial',
      paymentDate: new Date().toISOString().split('T')[0],
      ...initialData,
    },
  })

  const onSubmit = async (data: PaymentFormData) => {
    if (mode === 'create') {
      await createPayment.mutateAsync(data)
    } else if (paymentId) {
      await updatePayment.mutateAsync({ id: paymentId, data })
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Registrar pago' : 'Editar pago'}
      size="sm"
    >
      <form onSubmit={(e) => { void handleSubmit(onSubmit)(e) }} className="space-y-4">
        <div>
          <label className="label-base">Monto (ARS) *</label>
          <input
            type="number"
            {...register('amount', { valueAsNumber: true })}
            className="input-base"
            placeholder="Ej: 75000"
            min={0}
          />
          {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="label-base">Tipo de pago *</label>
          <select {...register('type')} className="input-base">
            {(Object.entries(PAYMENT_TYPE_LABELS) as [PaymentType, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-base">Fecha del pago *</label>
          <input type="date" {...register('paymentDate')} className="input-base" />
          {errors.paymentDate && (
            <p className="text-red-400 text-xs mt-1">{errors.paymentDate.message}</p>
          )}
        </div>

        <div>
          <label className="label-base">Notas (opcional)</label>
          <input
            {...register('notes')}
            className="input-base"
            placeholder="Ej: Transferencia, efectivo..."
          />
        </div>

        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1 justify-center" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary flex-1 justify-center" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : mode === 'create' ? 'Registrar' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Delete Payment Button ────────────────────────────────────────────────────

function DeletePaymentButton({ paymentId, eventId }: { paymentId: string; eventId: string }) {
  const del = useDeletePayment(eventId)
  return (
    <button
      className="btn-ghost p-1.5 hover:text-red-400"
      onClick={() => { void del.mutateAsync(paymentId) }}
      disabled={del.isPending}
      aria-label="Eliminar pago"
    >
      <Trash2 size={13} />
    </button>
  )
}
