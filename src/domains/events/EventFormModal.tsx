import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { eventSchema } from '@/lib/validations'
import type { EventFormData } from '@/lib/types'
import { EVENT_STATUS_LABELS } from '@/lib/types'
import type { EventStatus } from '@/lib/database.types'
import { Modal } from '@/shared/Modal'
import { PlaceDropdown } from '@/domains/places'
import { useCreateEvent, useUpdateEvent } from './events.hooks'

interface EventFormModalProps {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  initialData?: Partial<EventFormData>
  eventId?: string
}

export function EventFormModal({
  open,
  onClose,
  mode,
  initialData,
  eventId,
}: EventFormModalProps) {
  const create = useCreateEvent()
  const update = useUpdateEvent()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      status: 'query',
      includesLightingBudget: false,
      ...initialData,
    },
  })

  const onSubmit = async (data: EventFormData) => {
    if (mode === 'create') {
      await create.mutateAsync(data)
    } else if (eventId) {
      await update.mutateAsync({ id: eventId, data })
    }
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo evento' : 'Editar evento'}
      size="lg"
    >
      <form onSubmit={(e) => { void handleSubmit(onSubmit)(e) }} className="space-y-4">
        {/* Name */}
        <div>
          <label className="label-base">Nombre del evento *</label>
          <input
            {...register('name')}
            className="input-base"
            placeholder="Ej: Cumpleaños de Ana"
          />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Date + Times */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label-base">Fecha *</label>
            <input type="date" {...register('date')} className="input-base" />
            {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date.message}</p>}
          </div>
          <div>
            <label className="label-base">Hora inicio *</label>
            <input type="time" {...register('startTime')} className="input-base" />
            {errors.startTime && (
              <p className="text-red-400 text-xs mt-1">{errors.startTime.message}</p>
            )}
          </div>
          <div>
            <label className="label-base">Hora fin</label>
            <input type="time" {...register('endTime')} className="input-base" />
          </div>
        </div>

        {/* Place */}
        <Controller
          name="placeId"
          control={control}
          render={({ field }) => (
            <PlaceDropdown
              value={field.value ?? ''}
              onChange={field.onChange}
              error={errors.placeId?.message}
              allowCreate
            />
          )}
        />

        {/* Status */}
        <div>
          <label className="label-base">Estado *</label>
          <select {...register('status')} className="input-base">
            {(Object.entries(EVENT_STATUS_LABELS) as [EventStatus, string][]).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          {errors.status && <p className="text-red-400 text-xs mt-1">{errors.status.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="label-base">Descripción</label>
          <textarea
            {...register('description')}
            className="input-base resize-none"
            rows={3}
            placeholder="Detalles del evento..."
          />
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-2 p-3 bg-surface rounded-lg border border-surface-border">
          <input
            type="checkbox"
            id="includesLightingBudget"
            {...register('includesLightingBudget')}
            className="w-4 h-4 accent-brand-500"
          />
          <label htmlFor="includesLightingBudget" className="text-sm text-zinc-300 cursor-pointer">
            Incluye presupuesto de técnica de iluminación
          </label>
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
            {isSubmitting
              ? 'Guardando...'
              : mode === 'create'
                ? 'Crear evento'
                : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
