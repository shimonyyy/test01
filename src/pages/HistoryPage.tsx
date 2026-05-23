import { useState } from 'react'
import { ArrowDownToLine, ArrowRightLeft, ArrowUpFromLine, Download, Filter } from 'lucide-react'
import { useTransactions, type TxFilters } from '@/features/transactions/api'
import { useLocations } from '@/features/locations/api'
import { fmtDate, fmtDateTime, fmtNumber, todayDateString, todayFileStamp } from '@/lib/format'
import { downloadCsv, toCsv } from '@/lib/csv'

function defaultRange() {
  const to = todayDateString()
  const d = new Date()
  d.setDate(d.getDate() - 30)
  const from = d.toISOString().slice(0, 10)
  return { from, to }
}

export default function HistoryPage() {
  const [filters, setFilters] = useState<TxFilters>({ ...defaultRange(), limit: 500 })
  const { data: locations } = useLocations()
  const { data, isLoading } = useTransactions(filters)
  const [showFilters, setShowFilters] = useState(false)

  function exportCsv() {
    const rows = (data ?? []).map((tx: any) => ({
      일자: fmtDate(tx.transaction_date),
      등록일시: fmtDateTime(tx.created_at),
      구분: tx.type === 'in' ? '입고' : tx.type === 'out' ? '출고' : '이동',
      위치: tx.location?.name ?? '',
      도착지: tx.dest?.name ?? '',
      자재코드: tx.item?.code ?? '',
      자재명: tx.item?.name ?? '',
      수량: tx.quantity,
      단위: tx.item?.unit ?? '',
      거래처사용처: tx.partner ?? '',
      비고: tx.memo ?? '',
      입력자: tx.author?.name || tx.author?.email || ''
    }))
    downloadCsv(`${todayFileStamp()}_BERTI_입출고이력.csv`, toCsv(rows))
  }

  return (
    <div className="p-4 space-y-4">
      <header className="pt-4 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">입출고 이력</h1>
          <p className="text-sm text-slate-500">총 {data?.length ?? 0}건</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary !min-h-0 !px-3" onClick={() => setShowFilters((v) => !v)}>
            <Filter className="w-4 h-4 mr-1" /> 필터
          </button>
          <button className="btn-secondary !min-h-0 !px-3" onClick={exportCsv} disabled={!data?.length}>
            <Download className="w-4 h-4 mr-1" /> CSV
          </button>
        </div>
      </header>

      {showFilters && (
        <section className="card space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">시작일</label>
              <input className="field" type="date" value={filters.from ?? ''}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
            </div>
            <div>
              <label className="label">종료일</label>
              <input className="field" type="date" value={filters.to ?? ''}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">위치</label>
            <select className="field" value={filters.locationId ?? ''}
              onChange={(e) => setFilters({ ...filters, locationId: e.target.value || undefined })}>
              <option value="">전체</option>
              {locations?.map((l) => (<option key={l.id} value={l.id}>{l.name}</option>))}
            </select>
          </div>
          <div>
            <label className="label">구분</label>
            <div className="flex gap-2">
              {[
                { v: undefined, label: '전체' },
                { v: 'in' as const, label: '입고' },
                { v: 'out' as const, label: '출고' },
                { v: 'transfer' as const, label: '이동' }
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  className={`btn flex-1 !min-h-0 py-2 ${
                    filters.type === opt.v ? 'bg-brand-900 text-white' : 'bg-white border border-slate-200'
                  }`}
                  onClick={() => setFilters({ ...filters, type: opt.v })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

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
                  {tx.location?.name}{tx.dest ? ` → ${tx.dest.name}` : ''}
                </p>
                <p className="text-xs text-slate-400">
                  {fmtDate(tx.transaction_date)} · {tx.author?.name || tx.author?.email || ''}
                </p>
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
