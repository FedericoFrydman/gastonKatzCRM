import { z } from 'zod'

export const placeSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres').max(200),
  clarification: z.string().max(200).optional(),
})

export const eventSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida'),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Hora inválida')
    .optional()
    .or(z.literal('')),
  placeId: z.string().uuid('Lugar inválido').optional().or(z.literal('')),
  description: z.string().max(2000).optional(),
  status: z.enum(['confirmed', 'query', 'budget_pending', 'reserved']),
  includesLightingBudget: z.boolean(),
})

export const paymentSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Ingresá un monto válido' })
    .positive('El monto debe ser mayor a 0')
    .max(999_999_999, 'El monto es demasiado grande'),
  type: z.enum(['total', 'partial']),
  notes: z.string().max(500).optional(),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
})

export const financialsSchema = z.object({
  totalAmount: z
    .number({ invalid_type_error: 'Ingresá un monto válido' })
    .positive('El monto total debe ser mayor a 0')
    .max(999_999_999, 'El monto es demasiado grande'),
})
