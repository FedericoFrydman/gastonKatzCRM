import { supabase } from '@/lib/supabase'
import type {
  EventPayment,
  EventFinancials,
  EventPaymentSummary,
  PaymentFormData,
  FinancialsFormData,
} from '@/lib/types'
import type { Database } from '@/lib/database.types'

type PaymentRow = Database['public']['Tables']['event_payments']['Row']
type FinancialsRow = Database['public']['Tables']['event_financials']['Row']
type SummaryRow = Database['public']['Views']['event_payment_summary']['Row']

function mapPayment(row: PaymentRow): EventPayment {
  return {
    id: row.id,
    eventId: row.event_id,
    amount: row.amount,
    type: row.type,
    notes: row.notes,
    paymentDate: row.payment_date,
    createdAt: row.created_at,
  }
}

function mapFinancials(row: FinancialsRow): EventFinancials {
  return {
    id: row.id,
    eventId: row.event_id,
    totalAmount: row.total_amount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapSummary(row: SummaryRow): EventPaymentSummary {
  return {
    eventId: row.event_id,
    totalAmount: row.total_amount,
    totalPaid: row.total_paid,
    balance: row.balance,
    paymentStatus: row.payment_status,
  }
}

export async function fetchPayments(eventId: string): Promise<EventPayment[]> {
  const { data, error } = await supabase
    .from('event_payments')
    .select('id, event_id, amount, type, notes, payment_date, created_at')
    .eq('event_id', eventId)
    .order('payment_date', { ascending: false })

  if (error) throw error
  return data.map(mapPayment)
}

export async function fetchFinancials(eventId: string): Promise<EventFinancials | null> {
  const { data, error } = await supabase
    .from('event_financials')
    .select('id, event_id, total_amount, created_at, updated_at')
    .eq('event_id', eventId)
    .maybeSingle()

  if (error) throw error
  if (data === null) return null
  return mapFinancials(data)
}

export async function fetchPaymentSummary(eventId: string): Promise<EventPaymentSummary | null> {
  const { data, error } = await supabase
    .from('event_payment_summary')
    .select('event_id, total_amount, total_paid, balance, payment_status')
    .eq('event_id', eventId)
    .maybeSingle()

  if (error) throw error
  if (data === null) return null
  return mapSummary(data)
}

export async function upsertFinancials(
  eventId: string,
  input: FinancialsFormData,
): Promise<EventFinancials> {
  const { data, error } = await supabase
    .from('event_financials')
    .upsert(
      {
        event_id: eventId,
        total_amount: input.totalAmount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'event_id' },
    )
    .select()
    .single()

  if (error) throw error
  return mapFinancials(data)
}

export async function createPayment(
  eventId: string,
  input: PaymentFormData,
): Promise<EventPayment> {
  const { data, error } = await supabase
    .from('event_payments')
    .insert({
      event_id: eventId,
      amount: input.amount,
      type: input.type,
      notes: input.notes ?? null,
      payment_date: input.paymentDate,
    })
    .select()
    .single()

  if (error) throw error
  return mapPayment(data)
}

export async function updatePayment(
  id: string,
  input: Partial<PaymentFormData>,
): Promise<EventPayment> {
  const { data, error } = await supabase
    .from('event_payments')
    .update({
      ...(input.amount !== undefined && { amount: input.amount }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.notes !== undefined && { notes: input.notes ?? null }),
      ...(input.paymentDate !== undefined && { payment_date: input.paymentDate }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return mapPayment(data)
}

export async function deletePayment(id: string): Promise<void> {
  const { error } = await supabase.from('event_payments').delete().eq('id', id)
  if (error) throw error
}
