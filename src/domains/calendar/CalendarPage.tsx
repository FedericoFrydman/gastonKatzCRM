import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { useEventsByMonth } from '@/domains/events'
import { EventStatusBadge } from '@/shared/StatusBadge'
import { EventStatusMenu } from '@/domains/events/EventStatusMenu'
import type { Event } from '@/lib/types'
import { formatTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

const today = new Date()
const MIN_DATE = subMonths(today, 12)
const MAX_DATE = addMonths(today, 12)

export function CalendarPage() {
  const navigate = useNavigate()
  const [currentMonth, setCurrentMonth] = useState(today)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [direction, setDirection] = useState(0) // animation direction

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth() + 1

  const { data: events = [], isLoading } = useEventsByMonth(year, month)

  // Build full grid (Mon–Sun, 6 weeks max)
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  // Events indexed by date string for O(1) lookup.
  const eventsByDate: Map<string, Event[]> = events.reduce((acc, evt) => {
    const key = evt.date
    const current = acc.get(key) ?? []
    current.push(evt)
    acc.set(key, current)
    return acc
  }, new Map<string, Event[]>())

  const goToPrev = () => {
    if (subMonths(currentMonth, 1) >= MIN_DATE) {
      setDirection(-1)
      setCurrentMonth((d) => subMonths(d, 1))
      setSelectedDay(null)
    }
  }

  const goToNext = () => {
    if (addMonths(currentMonth, 1) <= MAX_DATE) {
      setDirection(1)
      setCurrentMonth((d) => addMonths(d, 1))
      setSelectedDay(null)
    }
  }

  const goToToday = () => {
    setDirection(0)
    setCurrentMonth(today)
    setSelectedDay(today)
  }

  const selectedEvents: Event[] = selectedDay
    ? (eventsByDate.get(format(selectedDay, 'yyyy-MM-dd')) ?? [])
    : []

  const monthKey = `${String(year)}-${String(month)}`
  const rowCount = String(days.length / 7)

  return (
    <div className="flex flex-col min-h-[calc(100dvh-57px)] md:min-h-screen">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 md:px-6 py-3 border-b border-surface-border shrink-0">
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <button
            className="btn-ghost p-1.5 disabled:opacity-30"
            onClick={goToPrev}
            disabled={subMonths(currentMonth, 1) < MIN_DATE}
            aria-label="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <AnimatePresence mode="wait">
            <motion.h1
              key={monthKey}
              initial={{ opacity: 0, y: direction * 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: direction * -8 }}
              transition={{ duration: 0.2 }}
              className="text-base sm:text-lg font-bold text-zinc-100 w-auto sm:w-44 text-center capitalize flex-1 sm:flex-none"
            >
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </motion.h1>
          </AnimatePresence>
          <button
            className="btn-ghost p-1.5 disabled:opacity-30"
            onClick={goToNext}
            disabled={addMonths(currentMonth, 1) > MAX_DATE}
            aria-label="Mes siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* Legend */}
          <div className="hidden md:flex items-center gap-3 text-xs text-zinc-500 mr-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-status-confirmed" /> Confirmado
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-status-query" /> Consulta
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-status-budget" /> Presupuesto
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-status-reserved" /> Reservado
            </span>
          </div>
          <button className="btn-secondary text-xs px-3 py-1.5" onClick={goToToday}>
            Hoy
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        {/* Calendar grid */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 border-b border-surface-border shrink-0">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
              <div
                key={d}
                className="text-center text-[10px] sm:text-xs font-medium text-zinc-500 py-2 uppercase tracking-wider"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={monthKey}
              initial={{ opacity: 0, x: direction * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -24 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="grid grid-cols-7 flex-1 min-h-[20rem] md:min-h-0"
              style={{ gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))` }}
            >
              {isLoading
                ? days.map((day) => (
                    <DayCell
                      key={day.toISOString()}
                      day={day}
                      currentMonth={currentMonth}
                      events={[]}
                      isSelected={false}
                      onClick={() => undefined}
                    />
                  ))
                : days.map((day) => {
                    const key = format(day, 'yyyy-MM-dd')
                    const dayEvents: Event[] = eventsByDate.get(key) ?? []
                    return (
                      <DayCell
                        key={day.toISOString()}
                        day={day}
                        currentMonth={currentMonth}
                        events={dayEvents}
                        isSelected={selectedDay ? isSameDay(day, selectedDay) : false}
                        onClick={() => {
                          setSelectedDay(day)
                        }}
                      />
                    )
                  })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Side panel — selected day events */}
        <AnimatePresence>
          {selectedDay && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="hidden md:flex flex-col border-l border-surface-border bg-surface-secondary overflow-hidden shrink-0"
            >
              <div className="px-4 py-3 border-b border-surface-border">
                <p className="text-xs text-zinc-500 uppercase tracking-wider">
                  {format(selectedDay, 'EEEE', { locale: es })}
                </p>
                <p className="text-lg font-bold text-zinc-100 capitalize">
                  {format(selectedDay, "d 'de' MMMM", { locale: es })}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {!selectedEvents.length ? (
                  <div className="text-center py-8 text-zinc-600">
                    <Calendar size={24} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Sin eventos este día</p>
                  </div>
                ) : (
                  selectedEvents.map((evt) => (
                    <EventCard
                      key={evt.id}
                      event={evt}
                      onOpenEvent={(eventId) => {
                        void navigate(`/events/${eventId}`)
                      }}
                    />
                  ))
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile selected day list */}
      {selectedDay && (
        <div className="md:hidden border-t border-surface-border bg-surface-secondary p-3 max-h-64 overflow-y-auto">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
            {format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}
          </p>
          {!selectedEvents.length ? (
            <p className="text-sm text-zinc-600">Sin eventos este día.</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((evt) => (
                <EventCard
                  key={evt.id}
                  event={evt}
                  onOpenEvent={(eventId) => {
                    void navigate(`/events/${eventId}`)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Day Cell ─────────────────────────────────────────────────────────────────

const STATUS_DOT_COLORS = {
  confirmed: 'bg-status-confirmed',
  query: 'bg-status-query',
  budget_pending: 'bg-status-budget',
  reserved: 'bg-status-reserved',
} as const

function DayCell({
  day,
  currentMonth,
  events,
  isSelected,
  onClick,
}: {
  day: Date
  currentMonth: Date
  events: Event[]
  isSelected: boolean
  onClick: () => void
}) {
  const inMonth = isSameMonth(day, currentMonth)
  const today_ = isToday(day)

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-start p-1 md:p-2 border-r border-b border-surface-border text-left transition-colors min-h-0',
        inMonth ? '' : 'opacity-30',
        isSelected ? 'bg-brand-500/10' : 'hover:bg-surface-hover',
      )}
    >
      {/* Day number */}
      <span
        className={cn(
          'inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 text-[10px] sm:text-xs font-medium rounded-full mb-1 shrink-0',
          today_
            ? 'bg-brand-500 text-white font-bold'
            : isSelected
              ? 'text-brand-400'
              : 'text-zinc-400',
        )}
      >
        {format(day, 'd')}
      </span>

      {/* Event dots / labels */}
      <div className="flex flex-col gap-0.5 w-full min-h-0">
        {events.slice(0, 3).map((evt) => (
          <div key={evt.id} className="flex items-center gap-1 w-full">
            <span
              className={cn('w-1.5 h-1.5 rounded-full shrink-0', STATUS_DOT_COLORS[evt.status])}
            />
            <span className="text-zinc-300 text-[10px] leading-tight truncate hidden md:block">
              {evt.name}
            </span>
          </div>
        ))}
        {events.length > 0 && (
          <div className="md:hidden flex flex-wrap gap-1 pt-0.5">
            {events.slice(0, 3).map((evt) => (
              <span
                key={`${evt.id}-mobile`}
                className={cn('w-1.5 h-1.5 rounded-full', STATUS_DOT_COLORS[evt.status])}
              />
            ))}
          </div>
        )}
        {events.length > 3 && (
          <span className="text-zinc-500 text-[9px] sm:text-[10px]">+{events.length - 3} más</span>
        )}
      </div>
    </button>
  )
}

// ─── Event Card in side panel ─────────────────────────────────────────────────

function EventCard({
  event,
  onOpenEvent,
}: {
  event: Event
  onOpenEvent: (eventId: string) => void
}) {
  return (
    <div className="group relative w-full text-left p-3 bg-surface rounded-lg border border-surface-border space-y-1.5 hover:border-brand-500/50 hover:bg-surface-hover transition-colors">
      {/* Quick status dot — top-right corner, appears on hover */}
      <div className="absolute top-2 right-2">
        <EventStatusMenu eventId={event.id} currentStatus={event.status} variant="compact" />
      </div>

      <button
        type="button"
        onClick={() => {
          onOpenEvent(event.id)
        }}
        className="w-full text-left"
      >
        <p className="font-medium text-zinc-100 text-sm leading-tight pr-5">{event.name}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <EventStatusBadge status={event.status} />
        </div>
        {event.place && <p className="text-zinc-500 text-xs truncate mt-1">{event.place.name}</p>}
        <p className="text-zinc-600 text-xs mt-0.5">{formatTime(event.startTime)}</p>
      </button>
    </div>
  )
}
