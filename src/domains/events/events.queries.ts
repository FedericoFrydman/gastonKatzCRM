import { addYears, format, isValid, parseISO } from 'date-fns'
import { supabase } from '@/lib/supabase'
import type { Event, EventFilters, EventFormData } from '@/lib/types'
import type { Database } from '@/lib/database.types'

type EventRow = Database['public']['Tables']['events']['Row']
type SelectedPlaceRow = Pick<
  Database['public']['Tables']['places']['Row'],
  'id' | 'name' | 'address' | 'clarification' | 'created_at' | 'updated_at'
>

const EVENT_IMAGES_BUCKET = 'event-images'
const EVENT_IMAGE_SIGNED_URL_TTL_SECONDS = 60 * 60
const EVENT_SELECT =
  'id, owner_id, name, date, start_time, end_time, place_id, description, whatsapp, email, ages, status, includes_lighting_budget, image_url, created_by, created_at, updated_at, places(id, name, address, clarification, created_at, updated_at)'

function normalizeOptionalString(value: string | undefined): string | null {
  if (value === undefined || value.trim() === '') return null
  return value
}

async function uploadEventImage(userId: string, image: File): Promise<string> {
  const ext = image.name.split('.').pop() ?? 'jpg'
  const path = `events/${userId}/${String(Date.now())}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(EVENT_IMAGES_BUCKET)
    .upload(path, image, { upsert: false })

  if (uploadError) throw uploadError

  return path
}

function getEventImagePath(imageReference: string | null): string | null {
  if (!imageReference) return null

  if (!imageReference.startsWith('http')) {
    return imageReference
  }

  try {
    const parsedUrl = new URL(imageReference)
    const match = parsedUrl.pathname.match(
      /\/storage\/v1\/object\/(?:public|sign|authenticated)\/event-images\/(.+)$/,
    )

    if (!match) return null

    return decodeURIComponent(match[1])
  } catch {
    return null
  }
}

async function getSignedEventImageUrl(imageReference: string | null): Promise<string | null> {
  const path = getEventImagePath(imageReference)
  if (!path) return null

  const { data, error } = await supabase.storage
    .from(EVENT_IMAGES_BUCKET)
    .createSignedUrl(path, EVENT_IMAGE_SIGNED_URL_TTL_SECONDS)

  if (error) {
    return null
  }

  return data.signedUrl
}

async function mapEvent(row: EventRow & { places?: SelectedPlaceRow | null }): Promise<Event> {
  const signedImageUrl = await getSignedEventImageUrl(row.image_url)

  return {
    id: row.id,
    name: row.name,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    placeId: row.place_id,
    place: row.places
      ? {
          id: row.places.id,
          name: row.places.name,
          address: row.places.address,
          clarification: row.places.clarification,
          createdAt: row.places.created_at,
          updatedAt: row.places.updated_at,
        }
      : undefined,
    description: row.description,
    whatsapp: row.whatsapp,
    email: row.email,
    ages: row.ages,
    status: row.status,
    includesLightingBudget: row.includes_lighting_budget,
    imageUrl: signedImageUrl,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function getExportDateTo(filters?: EventFilters): string | undefined {
  if (!filters?.dateFrom) return filters?.dateTo

  const parsedDateFrom = parseISO(filters.dateFrom)
  if (!isValid(parsedDateFrom)) return filters?.dateTo

  const oneYearWindow = format(addYears(parsedDateFrom, 1), 'yyyy-MM-dd')

  if (!filters.dateTo) {
    return oneYearWindow
  }

  return filters.dateTo < oneYearWindow ? filters.dateTo : oneYearWindow
}

function buildEventsQuery(filters?: EventFilters, options?: { applyExportWindow?: boolean }) {
  let query = supabase.from('events').select(EVENT_SELECT)

  let orderKey: 'date' | 'status' | 'created_at' = 'date'
  let ascending = true

  if (filters?.sortBy === 'status') {
    orderKey = 'status'
    ascending = true
  } else if (filters?.sortBy === 'created') {
    orderKey = 'created_at'
    ascending = false
  }

  query = query.order(orderKey, { ascending })

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.placeId) {
    query = query.eq('place_id', filters.placeId)
  }
  if (filters?.dateFrom) {
    query = query.gte('date', filters.dateFrom)
  }

  const effectiveDateTo = options?.applyExportWindow ? getExportDateTo(filters) : filters?.dateTo
  if (effectiveDateTo) {
    query = query.lte('date', effectiveDateTo)
  }

  return query
}

export async function fetchEvents(filters?: EventFilters): Promise<Event[]> {
  const pageSize = filters?.pageSize ?? 20
  const page = filters?.page ?? 1
  const offset = (page - 1) * pageSize

  let query = buildEventsQuery(filters)

  // Apply pagination
  query = query.range(offset, offset + pageSize - 1)

  const { data, error } = await query
  if (error) throw error
  return Promise.all(data.map(mapEvent))
}

export async function fetchEventsForExport(filters?: EventFilters): Promise<Event[]> {
  const { data, error } = await buildEventsQuery(filters, { applyExportWindow: true })

  if (error) throw error
  return Promise.all(data.map(mapEvent))
}

export async function fetchEventsByMonth(year: number, month: number): Promise<Event[]> {
  // month is 1-indexed
  const yearStr = String(year)
  const monthStr = String(month).padStart(2, '0')
  const from = `${yearStr}-${monthStr}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const to = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`

  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .gte('date', from)
    .lte('date', to)
    .order('start_time', { ascending: true })

  if (error) throw error
  return Promise.all(data.map(mapEvent))
}

export async function fetchEvent(id: string): Promise<Event> {
  const { data, error } = await supabase.from('events').select(EVENT_SELECT).eq('id', id).single()

  if (error) throw error
  return mapEvent(data)
}

export async function createEvent(input: EventFormData): Promise<Event> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  const normalizedEndTime = normalizeOptionalString(input.endTime)
  const normalizedPlaceId = normalizeOptionalString(input.placeId)
  const normalizedDescription = normalizeOptionalString(input.description)
  const normalizedWhatsapp = normalizeOptionalString(input.whatsapp)
  const normalizedEmail = normalizeOptionalString(input.email)
  const normalizedAges = normalizeOptionalString(input.ages)

  let imageUrl: string | null = null
  if (input.image) {
    imageUrl = await uploadEventImage(userData.user.id, input.image)
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
      owner_id: userData.user.id,
      name: input.name,
      date: input.date,
      start_time: input.startTime,
      end_time: normalizedEndTime,
      place_id: normalizedPlaceId,
      description: normalizedDescription,
      whatsapp: normalizedWhatsapp,
      email: normalizedEmail,
      ages: normalizedAges,
      status: input.status,
      includes_lighting_budget: input.includesLightingBudget,
      image_url: imageUrl,
      created_by: userData.user.id,
    })
    .select(EVENT_SELECT)
    .single()

  if (error) throw error
  return mapEvent(data)
}

export async function updateEvent(id: string, input: Partial<EventFormData>): Promise<Event> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  const normalizedEndTime =
    input.endTime !== undefined ? normalizeOptionalString(input.endTime) : undefined
  const normalizedPlaceId =
    input.placeId !== undefined ? normalizeOptionalString(input.placeId) : undefined
  const normalizedDescription =
    input.description !== undefined ? normalizeOptionalString(input.description) : undefined
  const normalizedWhatsapp =
    input.whatsapp !== undefined ? normalizeOptionalString(input.whatsapp) : undefined
  const normalizedEmail =
    input.email !== undefined ? normalizeOptionalString(input.email) : undefined
  const normalizedAges = input.ages !== undefined ? normalizeOptionalString(input.ages) : undefined

  let imageUrl: string | undefined
  if (input.image) {
    imageUrl = await uploadEventImage(userData.user.id, input.image)
  }

  const { data, error } = await supabase
    .from('events')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.date !== undefined && { date: input.date }),
      ...(input.startTime !== undefined && { start_time: input.startTime }),
      ...(normalizedEndTime !== undefined && { end_time: normalizedEndTime }),
      ...(normalizedPlaceId !== undefined && { place_id: normalizedPlaceId }),
      ...(normalizedDescription !== undefined && { description: normalizedDescription }),
      ...(normalizedWhatsapp !== undefined && { whatsapp: normalizedWhatsapp }),
      ...(normalizedEmail !== undefined && { email: normalizedEmail }),
      ...(normalizedAges !== undefined && { ages: normalizedAges }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.includesLightingBudget !== undefined && {
        includes_lighting_budget: input.includesLightingBudget,
      }),
      ...(imageUrl !== undefined && { image_url: imageUrl }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(EVENT_SELECT)
    .single()

  if (error) throw error
  return mapEvent(data)
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}
