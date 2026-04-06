import { useQuery } from '@tanstack/react-query'
import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  subMonths,
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  isFuture,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { TrendingUp, CalendarCheck, DollarSign, AlertCircle, Activity } from 'lucide-react'
import { fetchAnalyticsEvents, fetchAnalyticsPayments } from './analytics.queries'
import { EVENT_STATUS_LABELS } from '@/lib/types'
import type { EventStatus } from '@/lib/database.types'
import { cn } from '@/lib/utils'

// ─── Hooks ─────────────────────────────────────────────────────────────────────

function useAnalytics() {
  const events = useQuery({
    queryKey: ['analytics', 'events'],
    queryFn: fetchAnalyticsEvents,
    staleTime: 1000 * 60 * 5,
  })
  const payments = useQuery({
    queryKey: ['analytics', 'payments'],
    queryFn: fetchAnalyticsPayments,
    staleTime: 1000 * 60 * 5,
  })
  return { events, payments }
}

// ─── Number Counter Animation ──────────────────────────────────────────────────

function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
}: {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
}) {
  const [display, setDisplay] = useState(0)
  const raf = useRef<number | null>(null)
  const start = useRef<number | null>(null)
  const duration = 900

  useEffect(() => {
    if (raf.current !== null) cancelAnimationFrame(raf.current)
    start.current = null

    const from = display

    const step = (ts: number) => {
      if (start.current === null) start.current = ts
      const progress = Math.min((ts - start.current) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplay(from + (value - from) * ease)
      if (progress < 1) raf.current = requestAnimationFrame(step)
    }

    raf.current = requestAnimationFrame(step)
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const formatted =
    decimals === 0
      ? Math.round(display).toLocaleString('es-AR')
      : display.toLocaleString('es-AR', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}

// ─── SVG Bar Chart ─────────────────────────────────────────────────────────────

interface BarDatum {
  label: string
  value: number
  isFuture?: boolean
}

function BarChart({ data, color = '#3d5af1' }: { data: BarDatum[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const W = 100
  const H = 60
  const barW = W / data.length - 2
  const pad = 1

  return (
    <svg
      viewBox={`0 0 ${String(W)} ${String(H)}`}
      preserveAspectRatio="none"
      className="w-full h-full"
      aria-hidden
    >
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={0}
          y1={H - t * H}
          x2={W}
          y2={H - t * H}
          stroke="#2a3147"
          strokeWidth={0.4}
        />
      ))}

      {/* Bars */}
      {data.map((d, i) => {
        const barH = (d.value / max) * (H - 2)
        const x = i * (W / data.length) + pad
        const y = H - barH - 1

        return (
          <motion.rect
            key={d.label}
            x={x}
            width={barW}
            y={H - 1}
            height={0}
            rx={1}
            fill={d.isFuture ? '#2a3147' : color}
            fillOpacity={d.isFuture ? 1 : 0.85}
            animate={{ y, height: Math.max(barH, 0.5) }}
            transition={{ delay: i * 0.06, type: 'spring', stiffness: 200, damping: 20 }}
          />
        )
      })}
    </svg>
  )
}

// ─── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null
  const max = Math.max(...data, 1)
  const W = 100
  const H = 40
  const step = W / (data.length - 1)

  const points = data.map((v, i) => {
    const x = i * step
    const y = H - (v / max) * (H - 4) - 2
    return { x, y }
  })

  const d = 'M ' + points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')

  const area = d + ` L ${String(W)},${String(H)} L 0,${String(H)} Z`

  return (
    <svg
      viewBox={`0 0 ${String(W)} ${String(H)}`}
      preserveAspectRatio="none"
      className="w-full h-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3d5af1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3d5af1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={area}
        fill="url(#spark-fill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      />
      <motion.path
        d={d}
        fill="none"
        stroke="#3d5af1"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
    </svg>
  )
}

// ─── Status Proportion Bar ─────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#22c55e',
  query: '#f59e0b',
  budget_pending: '#8b5cf6',
  reserved: '#3b82f6',
}

function ProportionBar({ counts }: { counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((s, v) => s + v, 0)
  if (total === 0) return <div className="h-3 bg-surface-tertiary rounded-full" />

  const segments = Object.entries(counts).filter(([, v]) => v > 0)

  return (
    <div className="h-3 rounded-full overflow-hidden flex gap-px">
      {segments.map(([status, count]) => {
        const pct = (count / total) * 100
        return (
          <motion.div
            key={status}
            style={{ backgroundColor: STATUS_COLORS[status] ?? '#64748b' }}
            className="h-full"
            initial={{ width: 0 }}
            animate={{ width: String(pct) + '%' }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            title={`${EVENT_STATUS_LABELS[status as EventStatus]}: ${String(count)}`}
          />
        )
      })}
    </div>
  )
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, type: 'spring', stiffness: 300, damping: 28 },
  }),
}

function StatCard({
  label,
  value,
  prefix,
  suffix,
  decimals,
  icon: Icon,
  accent,
  index,
}: {
  label: string
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  icon: React.ElementType
  accent: string
  index: number
}) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="card p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 uppercase tracking-widest font-medium">{label}</span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: accent + '20' }}
        >
          <Icon size={15} style={{ color: accent }} />
        </div>
      </div>
      <p
        className="text-3xl font-display font-bold tabular-nums tracking-tight"
        style={{ color: accent }}
      >
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </p>
    </motion.div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const { events: eventsQ, payments: paymentsQ } = useAnalytics()

  const events = eventsQ.data ?? []
  const payments = paymentsQ.data ?? []

  const isLoading = eventsQ.isLoading || paymentsQ.isLoading

  // ── Derived stats ───────────────────────────────────────────────────────────

  const totalEvents = events.length

  const confirmedCount = events.filter((e) => e.status === 'confirmed').length

  const upcomingCount = events.filter((e) => isFuture(parseISO(e.date))).length

  const totalRevenue = payments.reduce((s, p) => s + (p.total_amount ?? 0), 0)

  const totalPaid = payments.reduce((s, p) => s + (p.total_paid ?? 0), 0)

  const totalBalance = payments.reduce((s, p) => s + (p.balance ?? 0), 0)

  // Events by status
  const statusCounts: Record<string, number> = {}
  for (const e of events) {
    statusCounts[e.status] = (statusCounts[e.status] ?? 0) + 1
  }

  // ── Monthly bars (last 6 months + current + next month) ────────────────────

  const now = new Date()
  const months: BarDatum[] = Array.from({ length: 8 }, (_, i) => {
    const d = subMonths(now, 5 - i)
    const interval = { start: startOfMonth(d), end: endOfMonth(d) }
    const count = events.filter((e) => {
      try {
        return isWithinInterval(parseISO(e.date), interval)
      } catch {
        return false
      }
    }).length
    return {
      label: format(d, 'MMM', { locale: es }),
      value: count,
      isFuture: isFuture(endOfMonth(d)),
    }
  })

  // Revenue sparkline (last 8 months)
  const revenueMonths = Array.from({ length: 8 }, (_, i) => {
    const d = subMonths(now, 7 - i)
    const interval = { start: startOfMonth(d), end: endOfMonth(d) }
    // Sum totalAmount for events in this month
    const monthRevenue = payments
      .filter((p) => {
        // We don't have event date here directly, so approximate by looking at events
        const ev = events.find((e) => e.id === p.event_id)
        if (!ev) return false
        try {
          return isWithinInterval(parseISO(ev.date), interval)
        } catch {
          return false
        }
      })
      .reduce((s, p) => s + (p.total_amount ?? 0), 0)
    return monthRevenue
  })

  const unpaidCount = payments.filter((p) => p.payment_status === 'unpaid').length

  // ── Render ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Activity size={20} className="text-brand-400" />
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Analytics</h1>
          <p className="text-zinc-500 text-sm">{totalEvents} eventos en total</p>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          index={0}
          label="Eventos totales"
          value={totalEvents}
          icon={CalendarCheck}
          accent="#3d5af1"
        />
        <StatCard
          index={1}
          label="Confirmados"
          value={confirmedCount}
          icon={TrendingUp}
          accent="#22c55e"
        />
        <StatCard
          index={2}
          label="Facturado total"
          value={totalRevenue}
          prefix="$"
          decimals={0}
          icon={DollarSign}
          accent="#f59e0b"
        />
        <StatCard
          index={3}
          label="Saldo pendiente"
          value={Math.abs(totalBalance)}
          prefix="$"
          decimals={0}
          icon={AlertCircle}
          accent={totalBalance > 0 ? '#ef4444' : '#22c55e'}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Events per month */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 220, damping: 26 }}
          className="card p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-200">Eventos por mes</h3>
            <span className="text-xs text-zinc-600 tabular-nums">{upcomingCount} próximos</span>
          </div>

          <div className="h-32">
            <BarChart data={months} color="#3d5af1" />
          </div>

          {/* X labels */}
          <div className="flex justify-between text-[10px] text-zinc-600 capitalize -mt-1">
            {months.map((m) => (
              <span key={m.label} className={cn(m.isFuture && 'opacity-40')}>
                {m.label}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Revenue trend */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, type: 'spring', stiffness: 220, damping: 26 }}
          className="card p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-200">Tendencia de ingresos</h3>
            <span className="text-xs text-zinc-600">
              ${totalPaid.toLocaleString('es-AR')} cobrado
            </span>
          </div>

          <div className="h-32">
            <Sparkline data={revenueMonths} />
          </div>
        </motion.div>
      </div>

      {/* Status breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 220, damping: 26 }}
        className="card p-5 space-y-4"
      >
        <h3 className="text-sm font-semibold text-zinc-200">Distribución por estado</h3>

        <ProportionBar counts={statusCounts} />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {(Object.keys(EVENT_STATUS_LABELS) as EventStatus[]).map((status) => {
            const count = statusCounts[status] ?? 0
            const pct = totalEvents > 0 ? Math.round((count / totalEvents) * 100) : 0
            return (
              <div key={status} className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[status] ?? '#64748b' }}
                  />
                  <span className="text-xs text-zinc-400">{EVENT_STATUS_LABELS[status]}</span>
                </div>
                <p className="text-xl font-display font-bold text-zinc-100 tabular-nums">
                  {count}
                  <span className="text-xs font-normal text-zinc-600 ml-1.5">{pct}%</span>
                </p>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Financial summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total facturado', value: totalRevenue, color: '#f59e0b' },
          { label: 'Total cobrado', value: totalPaid, color: '#22c55e' },
          { label: 'Saldo sin cobrar', value: Math.max(0, totalBalance), color: '#ef4444' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 + i * 0.07, type: 'spring', stiffness: 240, damping: 28 }}
            className="card p-4 space-y-1.5"
          >
            <span className="text-xs text-zinc-500 uppercase tracking-widest">{item.label}</span>
            <p
              className="text-2xl font-display font-bold tabular-nums"
              style={{ color: item.color }}
            >
              $<AnimatedNumber value={item.value} decimals={0} />
            </p>
          </motion.div>
        ))}
      </div>

      {/* Unpaid events callout */}
      {unpaidCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400"
        >
          <AlertCircle size={16} className="shrink-0" />
          <p className="text-sm">
            <span className="font-semibold">
              {unpaidCount} evento{unpaidCount !== 1 ? 's' : ''}
            </span>{' '}
            sin pagos registrados. Revisá los presupuestos pendientes.
          </p>
        </motion.div>
      )}
    </div>
  )
}
