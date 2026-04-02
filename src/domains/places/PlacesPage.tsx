import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { MapPin, Plus, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { usePlaces, useCreatePlace, useUpdatePlace, useDeletePlace } from './places.hooks'
import { Modal } from '@/shared/Modal'
import type { PlaceFormData } from '@/lib/types'
import { placeSchema } from '@/lib/validations'

export function PlacesPage() {
  const { data: places, isLoading } = usePlaces()
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<{ id: string } & PlaceFormData | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Lugares</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {places?.length ?? 0} lugares registrados
          </p>
        </div>
        <button className="btn-primary" onClick={() => { setCreateOpen(true) }}>
          <Plus size={16} />
          Nuevo lugar
        </button>
      </div>

      {/* List */}
      {!places?.length ? (
        <div className="card text-center py-12 text-zinc-500">
          <MapPin size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Todavía no hay lugares. Agregá el primero.</p>
        </div>
      ) : (
        <motion.ul
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
          className="space-y-2"
        >
          {places.map((place) => (
            <motion.li
              key={place.id}
              variants={{
                hidden: { opacity: 0, y: 8 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
              }}
              className="card flex items-center gap-4 group hover:border-surface-hover transition-colors"
            >
              <div className="w-9 h-9 bg-brand-500/15 rounded-lg flex items-center justify-center shrink-0">
                <MapPin size={16} className="text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-100 text-sm truncate">{place.name}</p>
                <p className="text-zinc-500 text-xs truncate">{place.address}</p>
                {place.clarification && (
                  <p className="text-zinc-600 text-xs truncate italic">{place.clarification}</p>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="btn-ghost p-1.5"
                  onClick={() => {
                    setEditTarget({
                      id: place.id,
                      name: place.name,
                      address: place.address,
                      clarification: place.clarification ?? undefined,
                    })
                  }}
                  aria-label="Editar"
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="btn-ghost p-1.5 hover:text-red-400"
                  onClick={() => { setDeleteTarget({ id: place.id, name: place.name }) }}
                  aria-label="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <ChevronRight size={14} className="text-zinc-700" />
            </motion.li>
          ))}
        </motion.ul>
      )}

      {/* Modals */}
      <PlaceFormModal
        open={createOpen}
        onClose={() => { setCreateOpen(false) }}
        mode="create"
      />
      {editTarget && (
        <PlaceFormModal
          open={!!editTarget}
          onClose={() => { setEditTarget(null) }}
          mode="edit"
          initialData={editTarget}
          placeId={editTarget.id}
        />
      )}
      {deleteTarget && (
        <DeletePlaceModal
          open={!!deleteTarget}
          onClose={() => { setDeleteTarget(null) }}
          placeId={deleteTarget.id}
          placeName={deleteTarget.name}
        />
      )}
    </div>
  )
}

// ─── Place Form Modal ─────────────────────────────────────────────────────────

function PlaceFormModal({
  open,
  onClose,
  mode,
  initialData,
  placeId,
}: {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  initialData?: PlaceFormData
  placeId?: string
}) {
  const create = useCreatePlace()
  const update = useUpdatePlace()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PlaceFormData>({
    resolver: zodResolver(placeSchema),
    defaultValues: initialData,
  })

  const onSubmit = async (data: PlaceFormData) => {
    if (mode === 'create') {
      await create.mutateAsync(data)
    } else if (placeId) {
      await update.mutateAsync({ id: placeId, data })
    }
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo lugar' : 'Editar lugar'}
      size="sm"
    >
      <form onSubmit={(e) => { void handleSubmit(onSubmit)(e) }} className="space-y-4">
        <div>
          <label className="label-base">Nombre del lugar *</label>
          <input
            {...register('name')}
            className="input-base"
            placeholder="Ej: Salón Pilar"
          />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label-base">Dirección exacta *</label>
          <input
            {...register('address')}
            className="input-base"
            placeholder="Ej: Arrasagueta 2345, Pilar"
          />
          {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address.message}</p>}
        </div>

        <div>
          <label className="label-base">Aclaración (opcional)</label>
          <input
            {...register('clarification')}
            className="input-base"
            placeholder="Ej: Entrada por el costado"
          />
          {errors.clarification && (
            <p className="text-red-400 text-xs mt-1">{errors.clarification.message}</p>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            className="btn-secondary flex-1 justify-center"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary flex-1 justify-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear lugar' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function DeletePlaceModal({
  open,
  onClose,
  placeId,
  placeName,
}: {
  open: boolean
  onClose: () => void
  placeId: string
  placeName: string
}) {
  const deletePlace = useDeletePlace()

  const handleDelete = async () => {
    await deletePlace.mutateAsync(placeId)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Eliminar lugar" size="sm">
      <p className="text-zinc-300 text-sm mb-5">
        ¿Estás seguro de que querés eliminar{' '}
        <span className="font-semibold text-zinc-100">{placeName}</span>? Esta acción no se puede deshacer.
      </p>
      <div className="flex gap-2">
        <button className="btn-secondary flex-1 justify-center" onClick={onClose}>
          Cancelar
        </button>
        <button
          className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          onClick={() => { void handleDelete() }}
          disabled={deletePlace.isPending}
        >
          {deletePlace.isPending ? 'Eliminando...' : 'Eliminar'}
        </button>
      </div>
    </Modal>
  )
}

// ─── Place Dropdown (reusable in EventForm) ───────────────────────────────────

export function PlaceDropdown({
  value,
  onChange,
  error,
  allowCreate = false,
}: {
  value: string
  onChange: (id: string) => void
  error?: string
  allowCreate?: boolean
}) {
  const { data: places } = usePlaces()
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)

  return (
    <>
      <div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="label-base">Lugar</label>
            <select
              className="input-base"
              value={value}
              onChange={(e) => { onChange(e.target.value) }}
            >
              <option value="">Sin lugar asignado</option>
              {places?.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name} — {place.address}
                  {place.clarification ? ` (${place.clarification})` : ''}
                </option>
              ))}
            </select>
          </div>
          {allowCreate && (
            <button
              type="button"
              className="btn-secondary px-3 py-2 shrink-0"
              onClick={() => { setQuickCreateOpen(true) }}
              title="Crear nuevo lugar"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>

      <PlaceFormModal
        open={quickCreateOpen}
        onClose={() => { setQuickCreateOpen(false) }}
        mode="create"
      />
    </>
  )
}
