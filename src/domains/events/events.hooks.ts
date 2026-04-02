import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchEvents,
  fetchEvent,
  fetchEventsByMonth,
  createEvent,
  updateEvent,
  deleteEvent,
} from './events.queries'
import type { EventFilters, EventFormData } from '@/lib/types'

export const eventsKeys = {
  all: ['events'] as const,
  list: (filters?: EventFilters) => ['events', 'list', filters] as const,
  detail: (id: string) => ['events', id] as const,
  month: (year: number, month: number) => ['events', 'month', year, month] as const,
}

export function useEvents(filters?: EventFilters) {
  return useQuery({
    queryKey: eventsKeys.list(filters),
    queryFn: () => fetchEvents(filters),
    staleTime: 1000 * 60 * 2,
  })
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: eventsKeys.detail(id),
    queryFn: () => fetchEvent(id),
    enabled: !!id,
  })
}

export function useEventsByMonth(year: number, month: number) {
  return useQuery({
    queryKey: eventsKeys.month(year, month),
    queryFn: () => fetchEventsByMonth(year, month),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: EventFormData) => createEvent(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: eventsKeys.all })
    },
  })
}

export function useUpdateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EventFormData> }) =>
      updateEvent(id, data),
    onSuccess: (_result, { id }) => {
      void qc.invalidateQueries({ queryKey: eventsKeys.all })
      void qc.invalidateQueries({ queryKey: eventsKeys.detail(id) })
    },
  })
}

export function useDeleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: eventsKeys.all })
    },
  })
}
