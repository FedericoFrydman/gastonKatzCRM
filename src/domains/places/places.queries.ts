import { supabase } from '@/lib/supabase'
import type { Place, PlaceFormData } from '@/lib/types'

function mapPlace(row: {
  id: string
  owner_id: string
  name: string
  address: string
  clarification: string | null
  created_at: string
  updated_at: string
}): Place {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    clarification: row.clarification,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function fetchPlaces(): Promise<Place[]> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data.map(mapPlace)
}

export async function fetchPlace(id: string): Promise<Place> {
  const { data, error } = await supabase.from('places').select('*').eq('id', id).single()

  if (error) throw error
  return mapPlace(data)
}

export async function createPlace(input: PlaceFormData): Promise<Place> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('places')
    .insert({
      owner_id: userData.user.id,
      name: input.name,
      address: input.address,
      clarification: input.clarification ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return mapPlace(data)
}

export async function updatePlace(id: string, input: Partial<PlaceFormData>): Promise<Place> {
  const { data, error } = await supabase
    .from('places')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.clarification !== undefined && { clarification: input.clarification }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return mapPlace(data)
}

export async function deletePlace(id: string): Promise<void> {
  const { error } = await supabase.from('places').delete().eq('id', id)
  if (error) throw error
}
