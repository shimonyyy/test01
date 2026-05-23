import { useAuth } from '@/features/auth/AuthProvider'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export default function MorePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    toast.success('로그아웃되었습니다.')
    navigate('/login', { replace: true })
  }

  return (
    <div className="p-4 space-y-4">
      <header className="pt-4">
        <h1 className="text-xl font-bold">더보기</h1>
      </header>

      <section className="card">
        <p className="text-sm text-slate-500">로그인 계정</p>
        <p className="font-medium mt-0.5">{user?.email}</p>
      </section>

      <section className="card space-y-2">
        <p className="text-sm text-slate-500">메뉴 (Phase 3~4에서 활성화)</p>
        <ul className="text-sm space-y-1 list-disc list-inside text-slate-600">
          <li>재고 현황</li>
          <li>입출고 이력</li>
          <li>자재 관리 (관리자)</li>
          <li>위치 관리 (관리자)</li>
          <li>사용자 관리 (관리자)</li>
          <li>보고서 / Excel</li>
          <li>설정 (푸시 알림, 기본 위치)</li>
        </ul>
      </section>

      <button onClick={handleSignOut} className="btn-secondary w-full">
        로그아웃
      </button>
    </div>
  )
}
