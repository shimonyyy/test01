import { Link } from 'react-router-dom'
import { ArrowDownToLine, ArrowRightLeft, ArrowUpFromLine } from 'lucide-react'
import { useInventoryByLocationSummary } from '@/features/inventory/api'
import { useRecentTransactions } from '@/features/transactions/api'
import { fmtDateTime, fmtNumber } from '@/lib/format'
import { useOfflineQueue } from '@/features/offline/queue'
import { useAuth } from '@/features/auth/AuthProvider'

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: summary } = useInventoryByLocationSummary()
  const { data: recent } = useRecentTransactions(10)
  const { count: pending, online } = useOfflineQueue()

  return (
    <div className="p-4 space-y-4">
      <header className="pt-4">
        <h1 className="text-xl font-bold">대시보드</h1>
        <p className="text-sm text-slate-500">{user?.email}</p>
        {!online && (
          <p className="text-xs text-amber-600 mt-1">오프라인 모드 · 입력은 자동 임시 저장됩니다.</p>
        )}
        {pending > 0 && (
          <p className="text-xs text-blue-600 mt-1">미동기 입력 {pending}건이 큐에 대기 중입니다.</p>
        )}
      </header>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">위치별 재고</h2>
          <Link to="/inventory" className="text-xs text-brand-900 font-semibold">자세히</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1">
          {summary?.map((s) => (
            <div key={s.id} className="card min-w-[180px] flex-shrink-0">
              <p className="text-xs text-slate-500">{s.type === 'warehouse' ? '창고' : '현장'}</p>
              <p className="font-semibold">{s.name}</p>
              <p className="text-2xl font-bold tabular-nums mt-1">{fmtNumber(s.total, 0)}</p>
              <p className="text-xs text-slate-500">{s.itemCount}개 자재</p>
            </div>
          ))}
          {(!summary || summary.length === 0) && (
            <div className="card text-sm text-slate-500 flex-1">아직 재고 데이터가 없습니다.</div>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">최근 입출고</h2>
          <Link to="/history" className="text-xs text-brand-900 font-semibold">전체보기</Link>
        </div>
        <ul className="space-y-2">
          {recent?.map((tx: any) => {
            const Icon = tx.type === 'in' ? ArrowDownToLine : tx.type === 'out' ? ArrowUpFromLine : ArrowRightLeft
            const color = tx.type === 'in' ? 'text-emerald-600' : tx.type === 'out' ? 'text-rose-600' : 'text-slate-600'
            return (
              <li key={tx.id} className="card flex items-start gap-3">
                <Icon className={`w-5 h-5 ${color}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {tx.item?.name ?? '자재'} · {fmtNumber(tx.quantity)} {tx.item?.unit ?? ''}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {tx.location?.name}{tx.dest ? ` → ${tx.dest.name}` : ''}
                  </p>
                  <p className="text-xs text-slate-400">{fmtDateTime(tx.created_at)}</p>
                </div>
              </li>
            )
          })}
          {(!recent || recent.length === 0) && (
            <li className="card text-sm text-slate-500">아직 입출고 이력이 없습니다.</li>
          )}
        </ul>
      </section>
    </div>
  )
}
