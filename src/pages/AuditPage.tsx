import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { History } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useIsAdmin } from '@/features/auth/useProfile'
import { fmtDateTime, fmtNumber } from '@/lib/format'

type AuditRow = {
  id: number
  transaction_id: string
  action: 'update' | 'delete'
  old_row: any
  new_row: any
  actor: string | null
  at: string
  actor_profile?: { name: string; email: string } | null
}

export default function AuditPage() {
  const isAdmin = useIsAdmin()
  if (!isAdmin) return <Navigate to="/" replace />

  const { data, isLoading } = useQuery<AuditRow[]>({
    queryKey: ['audits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_audits')
        .select(`*, actor_profile:profiles!transaction_audits_actor_fkey(name,email)`)
        .order('at', { ascending: false })
        .limit(200)
      if (error) throw error
      return data as AuditRow[]
    }
  })

  return (
    <div className="p-4 space-y-4">
      <header className="pt-4">
        <h1 className="text-xl font-bold">감사 로그 (Audit)</h1>
        <p className="text-sm text-slate-500">최근 200건 · 입출고 수정/삭제 이력</p>
      </header>

      {isLoading && <p className="text-sm text-slate-500">불러오는 중…</p>}

      <ul className="space-y-2">
        {data?.map((a) => {
          const old = a.old_row ?? {}
          const next = a.new_row ?? {}
          return (
            <li key={a.id} className="card flex items-start gap-3">
              <History className="w-5 h-5 text-slate-400" />
              <div className="flex-1 min-w-0 text-sm">
                <p className="font-semibold">
                  {a.action === 'update' ? '수정' : '삭제'} · 트랜잭션 {a.transaction_id.slice(0, 8)}…
                </p>
                <p className="text-xs text-slate-500">
                  {fmtDateTime(a.at)} · {a.actor_profile?.name || a.actor_profile?.email || a.actor || '-'}
                </p>
                {a.action === 'update' ? (
                  <p className="text-xs text-slate-600 mt-1">
                    수량 {fmtNumber(old.quantity)} → {fmtNumber(next.quantity)}, 비고:{' '}
                    {old.memo || '-'} → {next.memo || '-'}
                  </p>
                ) : (
                  <p className="text-xs text-slate-600 mt-1">
                    삭제된 수량: {fmtNumber(old.quantity)} ({old.type})
                  </p>
                )}
              </div>
            </li>
          )
        })}
        {data?.length === 0 && (
          <li className="card text-sm text-slate-500 text-center">감사 로그가 없습니다.</li>
        )}
      </ul>
    </div>
  )
}
