import { useAuth } from './AuthProvider'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

export default function PendingApprovalPage() {
  const { user, signOut } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ['profile'] })
  }
  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-full flex items-center justify-center p-6 safe-top">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold">관리자 승인 대기 중</h1>
        <p className="text-sm text-slate-500">
          가입이 접수되었습니다. 관리자 승인 후 로그인이 가능합니다.<br />
          승인 완료 후 새로고침을 눌러 주세요.
        </p>
        <p className="text-xs text-slate-400">{user?.email}</p>
        <button className="btn-primary w-full" onClick={refresh}>승인 상태 새로고침</button>
        <button className="btn-secondary w-full" onClick={handleSignOut}>로그아웃</button>
      </div>
    </div>
  )
}
