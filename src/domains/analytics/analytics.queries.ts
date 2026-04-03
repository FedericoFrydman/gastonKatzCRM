import { supabase } from '@/lib/supabase'

export interface AnalyticsEventRow {
  id: string
  date: string
  status: string
}

export interface AnalyticsPaymentRow {
  event_id: string
  total_amount: number | null
  total_paid: number | null
  balance: number | null
  payment_status: string | null
}

export async function fetchAnalyticsEvents(): Promise<AnalyticsEventRow[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id, date, status')
    .order('date', { ascending: true })

  if (error) throw error
  return data as AnalyticsEventRow[]
}

export async function fetchAnalyticsPayments(): Promise<AnalyticsPaymentRow[]> {
  const { data, error } = await supabase
    .from('event_payment_summary')
    .select('*')

  if (error) throw error
  return data as AnalyticsPaymentRow[]
}
