import { Link, useNavigate } from 'react-router-dom'
import {
  Boxes,
  ChevronRight,
  ClipboardList,
  LogOut,
  Package,
  Warehouse
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/AuthProvider'
import { useIsAdmin, useProfile } from '@/features/auth/useProfile'

export default function MorePage() {
  const { user, signOut } = useAuth()
  const { data: profile } = useProfile()
  const isAdmin = useIsAdmin()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    toast.success('로그아웃되었습니다.')
    navigate('/login', { replace: true })
  }

  const menu: Array<{ to: string; label: string; icon: any; adminOnly?: boolean }> = [
    { to: '/inventory', label: '재고 현황', icon: Boxes },
    { to: '/history', label: '입출고 이력', icon: ClipboardList },
    { to: '/items', label: '자재 관리', icon: Package },
    { to: '/locations', label: '위치(창고) 관리', icon: Warehouse }
  ]

  return (
    <div className="p-4 space-y-4">
      <header className="pt-4">
        <h1 className="text-xl font-bold">더보기</h1>
      </header>

      <section className="card">
        <p className="text-sm text-slate-500">로그인 계정</p>
        <p className="font-medium mt-0.5">{user?.email}</p>
        {profile && (
          <p className="text-xs text-slate-400 mt-0.5">
            {profile.name || '이름 미설정'} · {profile.role === 'admin' ? '관리자' : '일반사용자'}
          </p>
        )}
      </section>

      <section className="card !p-0 overflow-hidden">
        <ul className="divide-y divide-slate-100">
          {menu.map((m) => (
            <li key={m.to}>
              <Link
                to={m.to}
                className="flex items-center gap-3 p-4 active:bg-slate-50"
              >
                <m.icon className="w-5 h-5 text-slate-500" />
                <span className="flex-1 font-medium">{m.label}</span>
                {m.adminOnly && !isAdmin && (
                  <span className="text-[10px] text-slate-400">관리자</span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <button onClick={handleSignOut} className="btn-secondary w-full">
        <LogOut className="w-4 h-4 mr-2" /> 로그아웃
      </button>
    </div>
  )
}
