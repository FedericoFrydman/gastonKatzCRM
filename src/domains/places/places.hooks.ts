import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchPlaces,
  fetchPlace,
  createPlace,
  updatePlace,
  deletePlace,
} from './places.queries'
import type { PlaceFormData } from '@/lib/types'

export const placesKeys = {
  all: ['places'] as const,
  detail: (id: string) => ['places', id] as const,
}

export function usePlaces() {
  return useQuery({
    queryKey: placesKeys.all,
    queryFn: fetchPlaces,
    staleTime: 1000 * 60 * 5, // 5 min — places rarely change
  })
}

export function usePlace(id: string) {
  return useQuery({
    queryKey: placesKeys.detail(id),
    queryFn: () => fetchPlace(id),
    enabled: !!id,
  })
}

export function useCreatePlace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PlaceFormData) => createPlace(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: placesKeys.all })
    },
  })
}

export function useUpdatePlace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PlaceFormData> }) =>
      updatePlace(id, data),
    onSuccess: (_result, { id }) => {
      void qc.invalidateQueries({ queryKey: placesKeys.all })
      void qc.invalidateQueries({ queryKey: placesKeys.detail(id) })
    },
  })
}

export function useDeletePlace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePlace(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: placesKeys.all })
    },
  })
}
