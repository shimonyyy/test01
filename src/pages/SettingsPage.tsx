import { useEffect, useState } from 'react'
import { Bell, BellOff, Database, Fingerprint } from 'lucide-react'
import { toast } from 'sonner'
import { useOfflineQueue, flushQueue } from '@/features/offline/queue'
import { useProfile } from '@/features/auth/useProfile'
import { useLocations } from '@/features/locations/api'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

export default function SettingsPage() {
  const { data: profile } = useProfile()
  const { data: locations } = useLocations()
  const { count, online } = useOfflineQueue()
  const qc = useQueryClient()

  const [notifPerm, setNotifPerm] = useState<NotificationPermission | 'unsupported'>(
    typeof window === 'undefined' || !('Notification' in window)
      ? 'unsupported'
      : Notification.permission
  )

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotifPerm('unsupported')
      return
    }
    setNotifPerm(Notification.permission)
  }, [])

  async function enableNotifications() {
    if (notifPerm === 'unsupported') return
    const perm = await Notification.requestPermission()
    setNotifPerm(perm)
    if (perm === 'granted') {
      toast.success('알림 권한이 허용되었습니다.')
      new Notification('BERTI 알림 활성화', {
        body: '안전재고 미달 시 알림을 받게 됩니다.',
        icon: '/favicon.svg'
      })
    } else {
      toast.warning('알림이 차단되었습니다. 브라우저 설정에서 재허용해야 합니다.')
    }
  }

  async function setDefaultLocation(id: string) {
    if (!profile) return
    const { error } = await supabase.from('profiles').update({ default_location_id: id }).eq('id', profile.id)
    if (error) return toast.error('변경 실패', { description: error.message })
    qc.invalidateQueries({ queryKey: ['profile'] })
    toast.success('기본 위치가 변경되었습니다.')
  }

  return (
    <div className="p-4 space-y-4">
      <header className="pt-4">
        <h1 className="text-xl font-bold">설정</h1>
      </header>

      <section className="card space-y-3">
        <h2 className="font-semibold">기본 입출고 위치</h2>
        <select
          className="field"
          value={profile?.default_location_id ?? ''}
          onChange={(e) => setDefaultLocation(e.target.value)}
        >
          <option value="">선택 안 함</option>
          {locations?.map((l) => (<option key={l.id} value={l.id}>{l.name}</option>))}
        </select>
        <p className="text-xs text-slate-500">입출고 폼에서 자동 선택되는 위치입니다.</p>
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          {notifPerm === 'granted' ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          알림
        </h2>
        {notifPerm === 'unsupported' && (
          <p className="text-sm text-slate-500">이 브라우저는 알림을 지원하지 않습니다.</p>
        )}
        {notifPerm === 'denied' && (
          <p className="text-sm text-amber-700">알림이 차단되어 있습니다. 브라우저 사이트 설정에서 허용해 주세요.</p>
        )}
        {(notifPerm === 'default' || notifPerm === 'granted') && (
          <button className="btn-primary w-full" onClick={enableNotifications}>
            {notifPerm === 'granted' ? '알림 권한 재확인' : '알림 권한 허용'}
          </button>
        )}
        <p className="text-xs text-slate-400">
          * 서버 푸시 전송(VAPID + Edge Function)은 별도 백엔드 설정이 필요합니다. 현재는 권한 요청까지 지원됩니다.
        </p>
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Database className="w-4 h-4" /> 오프라인 큐
        </h2>
        <p className="text-sm">
          상태: {online ? <span className="text-emerald-600">온라인</span> : <span className="text-amber-600">오프라인</span>} · 미동기 {count}건
        </p>
        <button
          className="btn-secondary w-full"
          disabled={!online || count === 0}
          onClick={() => flushQueue().then(() => toast.success('동기화 시도 완료'))}
        >
          지금 동기화
        </button>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold flex items-center gap-2">
          <Fingerprint className="w-4 h-4" /> 생체 로그인
        </h2>
        <p className="text-sm text-slate-500">
          WebAuthn(생체) 로그인은 Supabase Auth MFA Factor 연동이 필요합니다. 향후 별도 마이그레이션으로 활성화됩니다.
        </p>
      </section>
    </div>
  )
}
