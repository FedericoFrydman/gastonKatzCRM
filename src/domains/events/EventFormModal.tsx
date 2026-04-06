import { useEffect, useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { eventSchema } from '@/lib/validations'
import type { EventFormData } from '@/lib/types'
import { EVENT_STATUS_LABELS } from '@/lib/types'
import type { EventStatus } from '@/lib/database.types'
import { Modal } from '@/shared/Modal'
import { PlaceDropdown } from '@/domains/places'
import { useCreateEvent, useUpdateEvent } from './events.hooks'
import { Upload, X } from 'lucide-react'

type EventFormInitialData = Partial<Omit<EventFormData, 'image'>> & {
  imageUrl?: string
}

interface EventFormModalProps {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  initialData?: EventFormInitialData
  eventId?: string
}

export function EventFormModal({ open, onClose, mode, initialData, eventId }: EventFormModalProps) {
  const create = useCreateEvent()
  const update = useUpdateEvent()
  const [imageFile, setImageFile] = useState<File | undefined>(undefined)
  const [imagePreview, setImagePreview] = useState<string | undefined>()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const initialImageUrl = useMemo(() => initialData?.imageUrl, [initialData?.imageUrl])

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(initialImageUrl)
      return
    }

    const objectUrl = URL.createObjectURL(imageFile)
    setImagePreview(objectUrl)
    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [imageFile, initialImageUrl])

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
    setSubmitError(null)

    const payload: EventFormData = {
      ...data,
      image: imageFile,
    }

    try {
      if (mode === 'create') {
        await create.mutateAsync(payload)
      } else if (eventId) {
        await update.mutateAsync({ id: eventId, data: payload })
      }

      setImageFile(undefined)
      reset()
      onClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudo guardar el evento')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo evento' : 'Editar evento'}
      size="lg"
    >
      <form
        onSubmit={(e) => {
          void handleSubmit(onSubmit)(e)
        }}
        className="space-y-4"
      >
        {submitError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {submitError}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="label-base">Nombre del evento *</label>
          <input {...register('name')} className="input-base" placeholder="Ej: Cumpleaños de Ana" />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Date + Times */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label-base">WhatsApp</label>
            <input
              {...register('whatsapp')}
              className="input-base"
              placeholder="Ej: +54 9 11 1234 5678"
            />
            {errors.whatsapp && <p className="text-red-400 text-xs mt-1">{errors.whatsapp.message}</p>}
          </div>

          <div>
            <label className="label-base">Email</label>
            <input
              {...register('email')}
              type="email"
              className="input-base"
              placeholder="ejemplo@mail.com"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>
        </div>

        <div>
          <label className="label-base">Edades</label>
          <input
            {...register('ages')}
            className="input-base"
            placeholder="Ej: 5 a 8 años, adultos, mixto..."
          />
          {errors.ages && <p className="text-red-400 text-xs mt-1">{errors.ages.message}</p>}
        </div>

        {/* Image upload */}
        <div>
          <label className="label-base">Imagen del evento (opcional)</label>
          {!imagePreview ? (
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-surface-border bg-surface px-4 py-7 cursor-pointer hover:border-brand-500/50 transition-colors">
              <Upload size={18} className="text-zinc-500" />
              <span className="text-sm text-zinc-400">Subir imagen JPG, PNG o WEBP</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setImageFile(file)
                }}
              />
            </label>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-surface-border bg-surface">
              <img src={imagePreview} alt="Preview evento" className="w-full h-44 object-cover" />
              <button
                type="button"
                onClick={() => {
                  setImageFile(undefined)
                  setImagePreview(undefined)
                }}
                className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-black/70 text-white hover:bg-black/80"
              >
                <X size={12} />
                Quitar
              </button>
            </div>
          )}
        </div>

        {/* Toggles */}
        <div className="flex items-start gap-2 p-3 bg-surface rounded-lg border border-surface-border">
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

        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
          <button
            type="button"
            className="btn-secondary flex-1 justify-center"
            onClick={() => {
              setImageFile(undefined)
              setImagePreview(initialImageUrl)
              onClose()
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary flex-1 justify-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear evento' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
