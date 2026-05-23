import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Shield, ShieldCheck, UserCheck, UserX } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useIsAdmin } from '@/features/auth/useProfile'
import { useAuth } from '@/features/auth/AuthProvider'
import type { Profile } from '@/lib/db.types'
import { fmtDate } from '@/lib/format'

export default function UsersPage() {
  const isAdmin = useIsAdmin()
  const { user } = useAuth()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery<Profile[]>({
    queryKey: ['profiles', 'all'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Profile[]
    }
  })

  const setRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: 'admin' | 'user' }) => {
      const { error } = await supabase.rpc('set_user_role', { p_user_id: id, p_role: role })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles'] })
  })

  const setApproved = useMutation({
    mutationFn: async ({ id, is_approved }: { id: string; is_approved: boolean }) => {
      const { error } = await supabase.from('profiles').update({ is_approved }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles'] })
  })

  if (!isAdmin) return <Navigate to="/" replace />

  return (
    <div className="p-4 space-y-4">
      <header className="pt-4">
        <h1 className="text-xl font-bold">사용자 관리</h1>
        <p className="text-sm text-slate-500">총 {data?.length ?? 0}명</p>
      </header>

      {isLoading && <p className="text-sm text-slate-500">불러오는 중…</p>}

      <ul className="space-y-2">
        {data?.map((p) => {
          const isSelf = p.id === user?.id
          return (
            <li key={p.id} className="card space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{p.name || '(이름 미설정)'}</p>
                  <p className="text-xs text-slate-500 truncate">{p.email}</p>
                  <p className="text-xs text-slate-400">
                    {p.department || '소속 없음'} · 가입 {fmtDate(p.created_at)}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] ${
                    p.role === 'admin' ? 'bg-brand-900 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {p.role === 'admin' ? '관리자' : '사용자'}
                </span>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  className="btn-secondary !min-h-0 !px-3 text-xs"
                  disabled={isSelf || setRole.isPending}
                  onClick={() =>
                    setRole.mutate(
                      { id: p.id, role: p.role === 'admin' ? 'user' : 'admin' },
                      {
                        onSuccess: () => toast.success('권한 변경됨'),
                        onError: (e: any) => toast.error('변경 실패', { description: e?.message })
                      }
                    )
                  }
                >
                  {p.role === 'admin' ? (
                    <><Shield className="w-3 h-3 mr-1" />일반사용자로</>
                  ) : (
                    <><ShieldCheck className="w-3 h-3 mr-1" />관리자로</>
                  )}
                </button>

                <button
                  className="btn-secondary !min-h-0 !px-3 text-xs"
                  disabled={setApproved.isPending}
                  onClick={() =>
                    setApproved.mutate(
                      { id: p.id, is_approved: !p.is_approved },
                      {
                        onSuccess: () => toast.success(p.is_approved ? '승인 취소' : '승인됨'),
                        onError: (e: any) => toast.error('변경 실패', { description: e?.message })
                      }
                    )
                  }
                >
                  {p.is_approved ? (
                    <><UserX className="w-3 h-3 mr-1" />승인 취소</>
                  ) : (
                    <><UserCheck className="w-3 h-3 mr-1" />승인</>
                  )}
                </button>

                {!p.is_approved && (
                  <span className="text-[10px] text-amber-700 self-center">승인 대기</span>
                )}
                {isSelf && <span className="text-[10px] text-slate-400 self-center">본인</span>}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
