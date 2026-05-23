import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { offlineDB, type QueuedTransaction } from './db'
import { queryClient } from '@/lib/queryClient'

export async function enqueue(tx: Omit<QueuedTransaction, 'id' | 'created_at' | 'retries'>) {
  await offlineDB.transactions.add({
    ...tx,
    created_at: Date.now(),
    retries: 0
  })
  window.dispatchEvent(new CustomEvent('berti:queue-changed'))
}

export async function pendingCount() {
  return offlineDB.transactions.count()
}

let syncing = false

export async function flushQueue() {
  if (syncing) return
  if (!navigator.onLine) return
  syncing = true
  try {
    const items = await offlineDB.transactions.orderBy('created_at').toArray()
    for (const item of items) {
      try {
        const rpc = item.kind === 'inbound' ? 'record_inbound' : 'record_outbound'
        const { error } = await supabase.rpc(rpc, item.payload as any)
        if (error) throw error
        await offlineDB.transactions.delete(item.id!)
      } catch (e: any) {
        await offlineDB.transactions.update(item.id!, {
          retries: (item.retries ?? 0) + 1,
          last_error: e?.message ?? 'unknown error'
        })
      }
    }
    queryClient.invalidateQueries({ queryKey: ['inventory'] })
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
    window.dispatchEvent(new CustomEvent('berti:queue-changed'))
  } finally {
    syncing = false
  }
}

export function useOfflineQueue() {
  const [count, setCount] = useState(0)
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    let mounted = true
    async function refresh() {
      const n = await pendingCount()
      if (mounted) setCount(n)
    }
    refresh()

    function onOnline() {
      setOnline(true)
      flushQueue().then(refresh).catch(() => refresh())
      toast.message('온라인 복귀: 미동기 입력을 동기화합니다.')
    }
    function onOffline() {
      setOnline(false)
      toast.warning('오프라인 모드: 입력은 임시 저장됩니다.')
    }
    function onChange() { refresh() }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('berti:queue-changed', onChange as EventListener)
    return () => {
      mounted = false
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('berti:queue-changed', onChange as EventListener)
    }
  }, [])

  return { count, online }
}
