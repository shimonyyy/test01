import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Transaction } from '@/lib/db.types'

export type InboundInput = {
  p_location_id: string
  p_item_id: string
  p_quantity: number
  p_transaction_date?: string
  p_partner?: string
  p_memo?: string
  p_photo_urls?: string[]
  p_client_uuid?: string
}

export type OutboundInput = InboundInput

export type TransferInput = {
  p_from_location_id: string
  p_to_location_id: string
  p_item_id: string
  p_quantity: number
  p_transaction_date?: string
  p_memo?: string
  p_client_uuid?: string
}

export function useRecordInbound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: InboundInput) => {
      const { data, error } = await supabase.rpc('record_inbound', {
        ...input,
        p_photo_urls: input.p_photo_urls ?? []
      })
      if (error) throw error
      return data as Transaction
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
    }
  })
}

export function useRecordOutbound() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: OutboundInput) => {
      const { data, error } = await supabase.rpc('record_outbound', {
        ...input,
        p_photo_urls: input.p_photo_urls ?? []
      })
      if (error) throw error
      return data as Transaction
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
    }
  })
}

export type TxFilters = {
  from?: string
  to?: string
  locationId?: string
  itemId?: string
  type?: 'in' | 'out' | 'transfer'
  userId?: string
  search?: string
  limit?: number
}

export function useTransactions(filters: TxFilters = {}) {
  return useQuery({
    queryKey: ['transactions', 'list', filters],
    queryFn: async () => {
      let q = supabase
        .from('transactions')
        .select(`
          *,
          item:items(id,code,name,unit),
          location:locations!transactions_location_id_fkey(id,name),
          dest:locations!transactions_dest_location_id_fkey(id,name),
          author:profiles!transactions_created_by_fkey(id,name,email)
        `)
        .order('created_at', { ascending: false })

      if (filters.from) q = q.gte('transaction_date', filters.from)
      if (filters.to) q = q.lte('transaction_date', filters.to)
      if (filters.locationId) q = q.eq('location_id', filters.locationId)
      if (filters.itemId) q = q.eq('item_id', filters.itemId)
      if (filters.type) q = q.eq('type', filters.type)
      if (filters.userId) q = q.eq('created_by', filters.userId)
      q = q.limit(filters.limit ?? 500)

      const { data, error } = await q
      if (error) throw error
      return data ?? []
    }
  })
}

export function useRecentTransactions(limit = 10) {
  return useQuery({
    queryKey: ['transactions', 'recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          item:items(id,code,name,unit),
          location:locations!transactions_location_id_fkey(id,name),
          dest:locations!transactions_dest_location_id_fkey(id,name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data ?? []
    }
  })
}
