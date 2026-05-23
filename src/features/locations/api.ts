import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Location } from '@/lib/db.types'

export function useLocations() {
  return useQuery<Location[]>({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('type', { ascending: true })
        .order('name', { ascending: true })
      if (error) throw error
      return data as Location[]
    }
  })
}

export function useCreateLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<Location, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('locations')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data as Location
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] })
  })
}

export function useUpdateLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Location> & { id: string }) => {
      const { data, error } = await supabase
        .from('locations')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Location
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] })
  })
}

export function useDeleteLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('locations').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] })
  })
}
