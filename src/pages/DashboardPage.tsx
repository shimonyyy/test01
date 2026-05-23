import { useAuth } from '@/features/auth/AuthProvider'

export default function DashboardPage() {
  const { user } = useAuth()
  return (
    <div className="p-4 space-y-4">
      <header className="pt-4">
        <h1 className="text-xl font-bold">대시보드</h1>
        <p className="text-sm text-slate-500">{user?.email}</p>
      </header>

      <section className="card">
        <h2 className="font-semibold mb-2">위치별 재고 (준비 중)</h2>
        <p className="text-sm text-slate-500">
          Phase 2에서 하남창고·용인창고·현장 야적장 카드가 표시됩니다.
        </p>
      </section>

      <section className="card">
        <h2 className="font-semibold mb-2">최근 입출고 (준비 중)</h2>
        <p className="text-sm text-slate-500">최근 10건의 입출고 이력이 표시됩니다.</p>
      </section>
    </div>
  )
}
