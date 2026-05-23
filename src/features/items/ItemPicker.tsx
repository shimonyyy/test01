import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { useItems } from './api'
import type { Item } from '@/lib/db.types'

export default function ItemPicker({
  onPick,
  onClose
}: {
  onPick: (item: Item) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useItems(search)

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col safe-top">
      <header className="flex items-center gap-2 p-3 border-b border-slate-200">
        <button className="btn-ghost !min-h-0 !px-2" onClick={onClose}>
          <X className="w-5 h-5" />
        </button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            autoFocus
            className="field pl-9"
            placeholder="자재명/코드/규격 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading && <p className="text-sm text-slate-500">불러오는 중…</p>}
        {data?.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-8">결과가 없습니다.</p>
        )}
        {data?.map((it) => (
          <button
            key={it.id}
            onClick={() => onPick(it)}
            className="card w-full text-left active:bg-slate-50"
          >
            <p className="font-semibold">{it.name}</p>
            <p className="text-xs text-slate-500">
              {it.code} · {it.spec || '규격 없음'} · 단위 {it.unit}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
