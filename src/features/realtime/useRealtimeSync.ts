import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { useAuth } from '@/features/auth/AuthProvider'

// inventory / transactions / items / locations 변경을 구독해
// TanStack Query 캐시를 무효화한다. (다중 사용자 실시간 반영)

export function useRealtimeSync() {
  const { session } = useAuth()
  useEffect(() => {
    if (!session) return
    const channel = supabase
      .channel('berti-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
        queryClient.invalidateQueries({ queryKey: ['inventory'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
        queryClient.invalidateQueries({ queryKey: ['items'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, () => {
        queryClient.invalidateQueries({ queryKey: ['locations'] })
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [session])
}
