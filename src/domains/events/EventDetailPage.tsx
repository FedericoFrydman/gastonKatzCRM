import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  MapPin,
  Clock,
  FileText,
  Lightbulb,
  DollarSign,
} from 'lucide-react'
import { useEvent, useDeleteEvent } from './events.hooks'
import { EventStatusBadge } from '@/shared/StatusBadge'
import { EventFormModal } from './EventFormModal'
import { EconomicsPanel } from '@/domains/economics'
import { formatDate, formatTime } from '@/lib/utils'

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: event, isLoading } = useEvent(id ?? '')
  const deleteEvent = useDeleteEvent()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!event) {
    return <div className="p-4 md:p-6 text-zinc-500 text-sm">Evento no encontrado.</div>
  }

  const handleDelete = async () => {
    await deleteEvent.mutateAsync(event.id)
    void navigate('/dashboard')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 md:p-6 max-w-4xl mx-auto"
    >
      {/* Back */}
      <button
        className="btn-ghost mb-4 -ml-1"
        onClick={() => {
          void navigate('/dashboard')
        }}
      >
        <ArrowLeft size={16} />
        Volver
      </button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
            <h1 className="text-2xl font-bold text-zinc-100 break-words">{event.name}</h1>
            <EventStatusBadge status={event.status} />
          </div>
          <p className="text-zinc-500 text-sm">
            Creado el {formatDate(event.createdAt, 'dd/MM/yyyy')}
          </p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-2 shrink-0">
          <button
            className="btn-secondary flex-1 sm:flex-none justify-center"
            onClick={() => {
              setEditOpen(true)
            }}
          >
            <Pencil size={15} />
            Editar
          </button>
          <button
            className="btn-ghost border border-surface-border hover:text-red-400 justify-center"
            onClick={() => {
              setDeleteConfirm(true)
            }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Details card */}
        <div className="card space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
            Detalles
          </h2>

          <div className="flex items-center gap-2.5 text-sm">
            <Clock size={15} className="text-zinc-600 shrink-0" />
            <span className="text-zinc-300">
              {formatDate(event.date, 'PPPP')} — {formatTime(event.startTime)}
              {event.endTime && ` a ${formatTime(event.endTime)}`}
            </span>
          </div>

          {event.place && (
            <div className="flex items-start gap-2.5 text-sm">
              <MapPin size={15} className="text-zinc-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-zinc-300">{event.place.name}</p>
                <p className="text-zinc-500 text-xs">{event.place.address}</p>
                {event.place.clarification && (
                  <p className="text-zinc-600 text-xs italic">{event.place.clarification}</p>
                )}
              </div>
            </div>
          )}

          {event.includesLightingBudget && (
            <div className="flex items-center gap-2.5 text-sm">
              <Lightbulb size={15} className="text-yellow-500 shrink-0" />
              <span className="text-zinc-300">Incluye presupuesto de iluminación</span>
            </div>
          )}

          {event.description && (
            <div className="flex items-start gap-2.5 text-sm">
              <FileText size={15} className="text-zinc-600 shrink-0 mt-0.5" />
              <p className="text-zinc-400 leading-relaxed">{event.description}</p>
            </div>
          )}
        </div>

        {/* Image */}
        {event.imageUrl && (
          <div className="card p-0 overflow-hidden aspect-video">
            <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Economics section */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign size={16} className="text-brand-400" />
          <h2 className="font-semibold text-zinc-100">Economía del evento</h2>
        </div>
        <EconomicsPanel eventId={event.id} />
      </div>

      {/* Edit modal */}
      <EventFormModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false)
        }}
        mode="edit"
        eventId={event.id}
        initialData={{
          name: event.name,
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime ?? undefined,
          placeId: event.placeId ?? undefined,
          description: event.description ?? undefined,
          status: event.status,
          includesLightingBudget: event.includesLightingBudget,
          imageUrl: event.imageUrl ?? undefined,
        }}
      />

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div className="bg-surface-secondary border border-surface-border rounded-2xl p-4 sm:p-6 max-w-sm w-full">
            <h3 className="font-semibold text-zinc-100 mb-2">¿Eliminar evento?</h3>
            <p className="text-zinc-400 text-sm mb-5">
              Esta acción no se puede deshacer. Se eliminará{' '}
              <span className="text-zinc-100 font-medium">{event.name}</span> junto con todos sus
              pagos.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <button
                className="btn-secondary flex-1 justify-center"
                onClick={() => {
                  setDeleteConfirm(false)
                }}
              >
                Cancelar
              </button>
              <button
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                onClick={() => {
                  void handleDelete()
                }}
                disabled={deleteEvent.isPending}
              >
                {deleteEvent.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
