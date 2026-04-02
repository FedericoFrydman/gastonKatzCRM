import { format, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatDate(dateStr: string, fmt = 'PPP'): string {
  const date = parseISO(dateStr)
  if (!isValid(date)) return dateStr
  return format(date, fmt, { locale: es })
}

export function formatTime(timeStr: string): string {
  // HH:mm:ss -> HH:mm
  return timeStr.slice(0, 5)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDatetime(dateStr: string, timeStr: string): string {
  const date = parseISO(dateStr)
  if (!isValid(date)) return dateStr
  return `${format(date, 'PPP', { locale: es })} a las ${formatTime(timeStr)}`
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
