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
