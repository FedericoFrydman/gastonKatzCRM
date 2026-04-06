import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import {
  Check,
  ChevronDown,
  ChevronRight,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { usePlaces, useCreatePlace, useUpdatePlace, useDeletePlace } from './places.hooks'
import { Modal } from '@/shared/Modal'
import type { Place, PlaceFormData } from '@/lib/types'
import { cn } from '@/lib/utils'
import { placeSchema } from '@/lib/validations'

export function PlacesPage() {
  const { data: places, isLoading } = usePlaces()
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<({ id: string } & PlaceFormData) | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Lugares</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{places?.length ?? 0} lugares registrados</p>
        </div>
        <button
          className="btn-primary w-full sm:w-auto justify-center"
          onClick={() => {
            setCreateOpen(true)
          }}
        >
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
              className="card flex items-start sm:items-center gap-3 sm:gap-4 group hover:border-surface-hover transition-colors"
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
              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity self-start sm:self-center">
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
                  onClick={() => {
                    setDeleteTarget({ id: place.id, name: place.name })
                  }}
                  aria-label="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <ChevronRight size={14} className="hidden sm:block text-zinc-700" />
            </motion.li>
          ))}
        </motion.ul>
      )}

      {/* Modals */}
      <PlaceFormModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false)
        }}
        mode="create"
      />
      {editTarget && (
        <PlaceFormModal
          open={!!editTarget}
          onClose={() => {
            setEditTarget(null)
          }}
          mode="edit"
          initialData={editTarget}
          placeId={editTarget.id}
        />
      )}
      {deleteTarget && (
        <DeletePlaceModal
          open={!!deleteTarget}
          onClose={() => {
            setDeleteTarget(null)
          }}
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
      <form
        onSubmit={(e) => {
          void handleSubmit(onSubmit)(e)
        }}
        className="space-y-4"
      >
        <div>
          <label className="label-base">Nombre del lugar *</label>
          <input {...register('name')} className="input-base" placeholder="Ej: Salón Pilar" />
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

        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
          <button type="button" className="btn-secondary flex-1 justify-center" onClick={onClose}>
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
        <span className="font-semibold text-zinc-100">{placeName}</span>? Esta acción no se puede
        deshacer.
      </p>
      <div className="flex flex-col-reverse sm:flex-row gap-2">
        <button className="btn-secondary flex-1 justify-center" onClick={onClose}>
          Cancelar
        </button>
        <button
          className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          onClick={() => {
            void handleDelete()
          }}
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
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedPlace = useMemo(() => places?.find((place) => place.id === value), [places, value])

  const filteredPlaces = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return places ?? []
    }

    return (places ?? []).filter((place) => {
      const haystack = [place.name, place.address, place.clarification ?? '']
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [places, query])

  useEffect(() => {
    if (!selectedPlace) {
      setQuery('')
      return
    }

    setQuery(selectedPlace.name)
  }, [selectedPlace])

  useEffect(() => {
    if (!open) return

    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
        setQuery(selectedPlace?.name ?? '')
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [open, selectedPlace])

  const handleSelectPlace = (place: Place) => {
    onChange(place.id)
    setQuery(place.name)
    setOpen(false)
  }

  const clearSelection = () => {
    onChange('')
    setQuery('')
    setOpen(false)
  }

  return (
    <>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-end gap-2">
          <div ref={containerRef} className="flex-1 min-w-0 relative">
            <label className="label-base">Lugar</label>
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
              />
              <input
                className="input-base pl-9 pr-20"
                value={query}
                placeholder="Buscar lugar..."
                onFocus={() => {
                  setOpen(true)
                }}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setOpen(true)
                  if (value) {
                    onChange('')
                  }
                }}
              />
              <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                {value && (
                  <button
                    type="button"
                    className="btn-ghost p-1"
                    onClick={clearSelection}
                    aria-label="Limpiar lugar"
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="button"
                  className="btn-ghost p-1"
                  onClick={() => {
                    setOpen((current) => !current)
                    if (!open) {
                      setQuery(selectedPlace?.name ?? query)
                    }
                  }}
                  aria-label="Mostrar lugares"
                >
                  <ChevronDown
                    size={14}
                    className={cn('transition-transform', open && 'rotate-180')}
                  />
                </button>
              </div>
            </div>

            {open && (
              <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-surface-border bg-surface-secondary shadow-xl">
                <button
                  type="button"
                  className={cn(
                    'w-full px-3 py-2.5 text-left text-sm transition-colors',
                    !value
                      ? 'bg-surface-hover text-zinc-100'
                      : 'text-zinc-300 hover:bg-surface-hover',
                  )}
                  onClick={clearSelection}
                >
                  Sin lugar asignado
                </button>
                <div className="max-h-64 overflow-y-auto border-t border-surface-border">
                  {filteredPlaces.length ? (
                    filteredPlaces.map((place) => {
                      const isSelected = place.id === value

                      return (
                        <button
                          key={place.id}
                          type="button"
                          className={cn(
                            'w-full px-3 py-2.5 text-left text-sm transition-colors',
                            isSelected
                              ? 'bg-brand-500/10 text-zinc-100'
                              : 'text-zinc-300 hover:bg-surface-hover',
                          )}
                          onClick={() => {
                            handleSelectPlace(place)
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-medium truncate">{place.name}</div>
                              <div className="text-xs text-zinc-500 truncate">{place.address}</div>
                              {place.clarification && (
                                <div className="text-xs text-zinc-600 truncate">
                                  {place.clarification}
                                </div>
                              )}
                            </div>
                            {isSelected && (
                              <Check size={14} className="mt-0.5 shrink-0 text-brand-400" />
                            )}
                          </div>
                        </button>
                      )
                    })
                  ) : (
                    <div className="px-3 py-3 text-sm text-zinc-500">
                      No hay lugares que coincidan.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {allowCreate && (
            <button
              type="button"
              className="btn-secondary px-3 py-2 shrink-0 justify-center"
              onClick={() => {
                setQuickCreateOpen(true)
              }}
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
        onClose={() => {
          setQuickCreateOpen(false)
        }}
        mode="create"
      />
    </>
  )
}
