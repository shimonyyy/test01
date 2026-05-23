import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Item } from '@/lib/db.types'

export function useItems(search?: string) {
  return useQuery<Item[]>({
    queryKey: ['items', search ?? ''],
    queryFn: async () => {
      let q = supabase.from('items').select('*').order('name', { ascending: true })
      if (search && search.trim()) {
        const s = `%${search.trim()}%`
        q = q.or(`name.ilike.${s},code.ilike.${s},spec.ilike.${s}`)
      }
      const { data, error } = await q.limit(200)
      if (error) throw error
      return data as Item[]
    }
  })
}

export function useItemByCode(code: string | null) {
  return useQuery<Item | null>({
    queryKey: ['items', 'by-code', code],
    enabled: !!code,
    queryFn: async () => {
      if (!code) return null
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('code', code)
        .maybeSingle()
      if (error) throw error
      return (data as Item) ?? null
    }
  })
}

export function useCreateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<Item, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('items').insert(input).select().single()
      if (error) throw error
      return data as Item
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] })
  })
}

export function useUpdateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Item> & { id: string }) => {
      const { data, error } = await supabase
        .from('items')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Item
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] })
  })
}

export function useDeleteItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] })
  })
}
