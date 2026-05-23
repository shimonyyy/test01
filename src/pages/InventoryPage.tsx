import { useMemo, useState } from 'react'
import { AlertTriangle, Search } from 'lucide-react'
import { useLocations } from '@/features/locations/api'
import { useInventory } from '@/features/inventory/api'
import { fmtNumber } from '@/lib/format'

export default function InventoryPage() {
  const { data: locations } = useLocations()
  const [locationId, setLocationId] = useState<string>('')
  const [search, setSearch] = useState('')
  const { data, isLoading } = useInventory({ locationId: locationId || undefined })

  const filtered = useMemo(() => {
    if (!data) return []
    const s = search.trim().toLowerCase()
    if (!s) return data
    return data.filter(
      (r) =>
        r.item.name.toLowerCase().includes(s) ||
        r.item.code.toLowerCase().includes(s) ||
        (r.item.spec ?? '').toLowerCase().includes(s)
    )
  }, [data, search])

  return (
    <div className="p-4 space-y-4">
      <header className="pt-4">
        <h1 className="text-xl font-bold">재고 현황</h1>
        <p className="text-sm text-slate-500">위치별·자재별 현재고를 확인합니다.</p>
      </header>

      <div className="flex gap-2">
        <select
          className="field flex-1"
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
        >
          <option value="">전체 위치</option>
          {locations?.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          className="field pl-9"
          placeholder="자재명/코드/규격 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading && <p className="text-sm text-slate-500">불러오는 중…</p>}
      {!isLoading && filtered.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-8">데이터가 없습니다.</p>
      )}

      <ul className="space-y-2">
        {filtered.map((row) => {
          const low = row.item.safety_stock > 0 && row.quantity < row.item.safety_stock
          return (
            <li key={row.id} className="card flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{row.item.name}</p>
                <p className="text-xs text-slate-500 truncate">
                  {row.item.code} · {row.item.spec || '규격 없음'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{row.location.name}</p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold tabular-nums ${low ? 'text-red-600' : ''}`}>
                  {fmtNumber(row.quantity)}
                </p>
                <p className="text-xs text-slate-500">{row.item.unit}</p>
                {low && (
                  <p className="text-[10px] text-red-600 flex items-center justify-end gap-0.5 mt-0.5">
                    <AlertTriangle className="w-3 h-3" /> 안전재고 미달
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
