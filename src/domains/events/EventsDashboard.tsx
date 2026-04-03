import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, SlidersHorizontal, CalendarDays, MapPin } from 'lucide-react'
import { useEvents } from './events.hooks'
import { EventStatusMenu } from './EventStatusMenu'
import type { EventFilters, EventSortBy } from '@/lib/types'
import type { EventStatus } from '@/lib/database.types'
import { EVENT_STATUS_LABELS } from '@/lib/types'
import { formatDate, formatTime } from '@/lib/utils'
import { EventFormModal } from './EventFormModal'
import { usePlaces } from '@/domains/places'

export function EventsDashboard() {
  const [filters, setFilters] = useState<EventFilters>({ page: 1, pageSize: 20, sortBy: 'date' })
  const [showFilters, setShowFilters] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const { data: events, isLoading } = useEvents(filters)
  const { data: places } = usePlaces()

  const pageSize = filters.pageSize ?? 20
  const page = filters.page ?? 1

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Eventos</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Página {page} {(events?.length ?? 0) > 0 ? '(mostrando hasta ' + String(pageSize) + ' por página)' : '(vacío)'}
          </p>
        </div>
        <button className="btn-primary" onClick={() => { setCreateOpen(true) }}>
          <Plus size={16} />
          Nuevo evento
        </button>
      </div>

      {/* Search + filters bar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            className="input-base pl-9"
            placeholder="Buscar por nombre..."
            value={filters.search ?? ''}
            onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value, page: 1 })) }}
          />
        </div>
        
        <select
          className="input-base"
          value={filters.sortBy ?? 'date'}
          onChange={(e) => {
            setFilters((f) => ({ ...f, sortBy: e.target.value as EventSortBy, page: 1 }))
          }}
        >
          <option value="date">Ordenar: Fecha</option>
          <option value="status">Ordenar: Estado</option>
          <option value="created">Ordenar: Creado</option>
        </select>

        <button
          className={showFilters ? 'btn-secondary' : 'btn-ghost border border-surface-border'}
          onClick={() => { setShowFilters(!showFilters) }}
        >
          <SlidersHorizontal size={15} />
          Filtros
        </button>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="card mb-4 grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <div>
            <label className="label-base">Estado</label>
            <select
              className="input-base"
              value={filters.status ?? ''}
              onChange={(e) => {
                setFilters((f) => ({
                  ...f,
                  status: e.target.value as EventStatus | '',
                  page: 1,
                }))
              }}
            >
              <option value="">Todos</option>
              {(Object.entries(EVENT_STATUS_LABELS) as [EventStatus, string][]).map(
                ([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="label-base">Lugar</label>
            <select
              className="input-base"
              value={filters.placeId ?? ''}
              onChange={(e) => { setFilters((f) => ({ ...f, placeId: e.target.value, page: 1 })) }}
            >
              <option value="">Todos</option>
              {places?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-base">Desde</label>
            <input
              type="date"
              className="input-base"
              value={filters.dateFrom ?? ''}
              onChange={(e) => { setFilters((f) => ({ ...f, dateFrom: e.target.value, page: 1 })) }}
            />
          </div>

          <div>
            <label className="label-base">Hasta</label>
            <input
              type="date"
              className="input-base"
              value={filters.dateTo ?? ''}
              onChange={(e) => { setFilters((f) => ({ ...f, dateTo: e.target.value, page: 1 })) }}
            />
          </div>

          <button
            className="btn-ghost text-xs col-span-2 md:col-span-4 justify-start"
            onClick={() => { setFilters({ page: 1, pageSize: 20, sortBy: 'date' }) }}
          >
            Limpiar filtros
          </button>
        </motion.div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !events?.length ? (
        <div className="card text-center py-16 text-zinc-500">
          <CalendarDays size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No hay eventos que coincidan con los filtros actuales.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-zinc-500 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Evento</th>
                <th className="text-left px-4 py-3 font-medium">Fecha</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Lugar</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, i) => (
                <motion.tr
                  key={event.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-surface-border last:border-0 hover:bg-surface-hover/60 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/events/${event.id}`}
                      className="font-medium text-zinc-100 hover:text-brand-400 transition-colors"
                    >
                      {event.name}
                    </Link>
                    {event.includesLightingBudget && (
                      <span className="ml-2 text-xs text-zinc-500">💡 iluminación</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                    <div>{formatDate(event.date, 'dd/MM/yyyy')}</div>
                    <div className="text-xs text-zinc-600">{formatTime(event.startTime)}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 hidden md:table-cell">
                    {event.place ? (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-zinc-600 shrink-0" />
                        <span className="truncate max-w-[160px]">{event.place.name}</span>
                      </div>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <EventStatusMenu eventId={event.id} currentStatus={event.status} />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {/* Pagination controls */}
          <div className="px-4 py-3 border-t border-surface-border flex items-center justify-between text-xs text-zinc-500">
            <div>
              Página {page}
            </div>
            <div className="flex gap-2">
              <button
                className="btn-ghost text-xs"
                onClick={() => { setFilters((f) => ({ ...f, page: Math.max(1, (f.page ?? 1) - 1) })) }}
                disabled={page === 1}
              >
                ← Anterior
              </button>
              <button
                className="btn-ghost text-xs"
                onClick={() => { setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 })) }}
                disabled={events.length < pageSize}
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      )}

      <EventFormModal
        open={createOpen}
        onClose={() => { setCreateOpen(false) }}
        mode="create"
      />
    </div>
  )
}
