import { useEffect } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'
import { flushQueue } from './queue'

// 앱 마운트 시 + 로그인 직후에 큐 동기화 시도.
export default function SyncManager() {
  const { session } = useAuth()
  useEffect(() => {
    if (!session) return
    flushQueue().catch(() => {})
  }, [session])
  return null
}
