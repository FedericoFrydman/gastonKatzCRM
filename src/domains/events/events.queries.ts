import { supabase } from '@/lib/supabase'
import type { Event, EventFilters, EventFormData } from '@/lib/types'
import type { Database } from '@/lib/database.types'

type EventRow = Database['public']['Tables']['events']['Row']

function normalizeOptionalString(value: string | undefined): string | null {
  if (value === undefined || value.trim() === '') return null
  return value
}

async function uploadEventImage(userId: string, image: File): Promise<string> {
  const ext = image.name.split('.').pop() ?? 'jpg'
  const path = `events/${userId}/${String(Date.now())}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('event-images')
    .upload(path, image, { upsert: false })

  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from('event-images').getPublicUrl(path)
  return urlData.publicUrl
}

function mapEvent(row: EventRow & { places?: Database['public']['Tables']['places']['Row'] | null }): Event {
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
    status: row.status,
    includesLightingBudget: row.includes_lighting_budget,
    imageUrl: row.image_url,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function fetchEvents(filters?: EventFilters): Promise<Event[]> {
  const pageSize = filters?.pageSize ?? 20
  const page = filters?.page ?? 1
  const offset = (page - 1) * pageSize

  // Determine sort order
  let orderKey: 'date' | 'status' | 'created_at' = 'date'
  let ascending = true

  if (filters?.sortBy === 'status') {
    orderKey = 'status'
    ascending = true
  } else if (filters?.sortBy === 'created') {
    orderKey = 'created_at'
    ascending = false
  }

  let query = supabase
    .from('events')
    .select('*, places(*)')
    .order(orderKey, { ascending })

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
  if (filters?.dateTo) {
    query = query.lte('date', filters.dateTo)
  }

  // Apply pagination
  query = query.range(offset, offset + pageSize - 1)

  const { data, error } = await query
  if (error) throw error
  return data.map(mapEvent)
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
    .select('*, places(*)')
    .gte('date', from)
    .lte('date', to)
    .order('start_time', { ascending: true })

  if (error) throw error
  return data.map(mapEvent)
}

export async function fetchEvent(id: string): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .select('*, places(*)')
    .eq('id', id)
    .single()

  if (error) throw error
  return mapEvent(data)
}

export async function createEvent(input: EventFormData): Promise<Event> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  const normalizedEndTime = normalizeOptionalString(input.endTime)
  const normalizedPlaceId = normalizeOptionalString(input.placeId)
  const normalizedDescription = normalizeOptionalString(input.description)

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
      status: input.status,
      includes_lighting_budget: input.includesLightingBudget,
      image_url: imageUrl,
      created_by: userData.user.id,
    })
    .select('*, places(*)')
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
      ...(input.status !== undefined && { status: input.status }),
      ...(input.includesLightingBudget !== undefined && {
        includes_lighting_budget: input.includesLightingBudget,
      }),
      ...(imageUrl !== undefined && { image_url: imageUrl }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, places(*)')
    .single()

  if (error) throw error
  return mapEvent(data)
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}
