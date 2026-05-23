import { useRecentTransactions } from '@/features/transactions/api'
import { fmtDateTime, fmtNumber } from '@/lib/format'
import { ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft } from 'lucide-react'

export default function HistoryPage() {
  const { data, isLoading } = useRecentTransactions(50)

  return (
    <div className="p-4 space-y-4">
      <header className="pt-4">
        <h1 className="text-xl font-bold">입출고 이력</h1>
        <p className="text-sm text-slate-500">최근 50건 · 필터 기능은 Phase 3에서 확장됩니다.</p>
      </header>

      {isLoading && <p className="text-sm text-slate-500">불러오는 중…</p>}

      <ul className="space-y-2">
        {data?.map((tx: any) => {
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
                  {tx.location?.name}
                  {tx.dest ? ` → ${tx.dest.name}` : ''}
                </p>
                <p className="text-xs text-slate-400">{fmtDateTime(tx.created_at)}</p>
                {tx.partner && <p className="text-xs text-slate-500 mt-0.5">{tx.partner}</p>}
                {tx.memo && <p className="text-xs text-slate-500 mt-0.5">{tx.memo}</p>}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
