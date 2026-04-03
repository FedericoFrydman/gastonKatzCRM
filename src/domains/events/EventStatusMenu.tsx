import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { useUpdateEvent } from './events.hooks'
import { EVENT_STATUS_LABELS } from '@/lib/types'
import type { EventStatus } from '@/lib/database.types'
import { cn } from '@/lib/utils'

// ─── Status colour tokens ──────────────────────────────────────────────────────

const STATUS_STYLES: Record<EventStatus, { dot: string; text: string; bg: string; hover: string }> = {
  confirmed: {
    dot: 'bg-status-confirmed',
    text: 'text-status-confirmed',
    bg: 'bg-status-confirmed/10',
    hover: 'hover:bg-status-confirmed/20',
  },
  query: {
    dot: 'bg-status-query',
    text: 'text-status-query',
    bg: 'bg-status-query/10',
    hover: 'hover:bg-status-query/20',
  },
  budget_pending: {
    dot: 'bg-status-budget',
    text: 'text-status-budget',
    bg: 'bg-status-budget/10',
    hover: 'hover:bg-status-budget/20',
  },
  reserved: {
    dot: 'bg-status-reserved',
    text: 'text-status-reserved',
    bg: 'bg-status-reserved/10',
    hover: 'hover:bg-status-reserved/20',
  },
}

const ALL_STATUSES = Object.keys(EVENT_STATUS_LABELS) as EventStatus[]

const dropdownVariants = {
  hidden: { opacity: 0, scale: 0.94, y: -4 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 500, damping: 30 },
  },
  exit: { opacity: 0, scale: 0.94, y: -4, transition: { duration: 0.12 } },
}

const itemVariants = {
  hidden: { opacity: 0, x: -6 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, duration: 0.15 },
  }),
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface EventStatusMenuProps {
  eventId: string
  currentStatus: EventStatus
  /** When 'compact', renders a small dot-only trigger (for calendar cards). */
  variant?: 'default' | 'compact'
}

export function EventStatusMenu({
  eventId,
  currentStatus,
  variant = 'default',
}: EventStatusMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { mutate: updateEvent, isPending } = useUpdateEvent()

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => { document.removeEventListener('mousedown', handler) }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => { document.removeEventListener('keydown', handler) }
  }, [open])

  const handleSelect = (status: EventStatus) => {
    if (status === currentStatus) {
      setOpen(false)
      return
    }
    updateEvent({ id: eventId, data: { status } })
    setOpen(false)
  }

  const styles = STATUS_STYLES[currentStatus]

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Trigger */}
      {variant === 'compact' ? (
        <button
          type="button"
          title={`Estado: ${EVENT_STATUS_LABELS[currentStatus]}`}
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
          className={cn(
            'w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-transparent transition-all',
            styles.dot,
            isPending ? 'animate-pulse' : 'hover:ring-white/30',
          )}
        />
      ) : (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium transition-all',
            styles.bg,
            styles.text,
            styles.hover,
            isPending && 'opacity-60 cursor-wait',
          )}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full', styles.dot)} />
          {EVENT_STATUS_LABELS[currentStatus]}
          <span className="text-[9px] opacity-50">▾</span>
        </button>
      )}

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute z-50 mt-1 left-0 w-52 bg-surface border border-surface-border rounded-xl shadow-xl overflow-hidden"
          >
            <div className="py-1">
              {ALL_STATUSES.map((status, i) => {
                const s = STATUS_STYLES[status]
                const isActive = status === currentStatus
                return (
                  <motion.button
                    key={status}
                    type="button"
                    custom={i}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    onClick={() => { handleSelect(status) }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-sm transition-colors',
                      isActive ? cn(s.bg, s.text) : 'text-zinc-300 hover:bg-surface-hover',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full shrink-0', s.dot)} />
                      {EVENT_STATUS_LABELS[status]}
                    </div>
                    {isActive && <Check size={13} className="opacity-70" />}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
