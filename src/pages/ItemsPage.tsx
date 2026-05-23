import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import {
  useCreateItem,
  useDeleteItem,
  useItems,
  useUpdateItem
} from '@/features/items/api'
import type { Item } from '@/lib/db.types'
import { fmtNumber } from '@/lib/format'
import { useIsAdmin } from '@/features/auth/useProfile'

export default function ItemsPage() {
  const isAdmin = useIsAdmin()
  const [search, setSearch] = useState('')
  const { data, isLoading } = useItems(search)
  const [editing, setEditing] = useState<Partial<Item> | null>(null)

  return (
    <div className="p-4 space-y-4">
      <header className="pt-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">자재 관리</h1>
          <p className="text-sm text-slate-500">총 {data?.length ?? 0}건</p>
        </div>
        {isAdmin && (
          <button
            className="btn-primary"
            onClick={() => setEditing({ unit: 'box', qty_per_box: 0, area_per_box: 0, safety_stock: 0 })}
          >
            <Plus className="w-4 h-4 mr-1" /> 추가
          </button>
        )}
      </header>

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

      <ul className="space-y-2">
        {data?.map((it) => (
          <li key={it.id} className="card flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{it.name}</p>
              <p className="text-xs text-slate-500 truncate">
                {it.code} · {it.spec || '규격 없음'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                단위 {it.unit} · 박스당 {fmtNumber(it.qty_per_box)} · 안전재고 {fmtNumber(it.safety_stock)}
              </p>
            </div>
            {isAdmin && (
              <button className="btn-ghost !min-h-0 !px-2" onClick={() => setEditing(it)}>
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {editing && <ItemEditor initial={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function ItemEditor({ initial, onClose }: { initial: Partial<Item>; onClose: () => void }) {
  const isEdit = !!initial.id
  const [form, setForm] = useState({
    code: initial.code ?? '',
    name: initial.name ?? '',
    spec: initial.spec ?? '',
    species: initial.species ?? '',
    color: initial.color ?? '',
    unit: initial.unit ?? 'box',
    qty_per_box: initial.qty_per_box ?? 0,
    area_per_box: initial.area_per_box ?? 0,
    safety_stock: initial.safety_stock ?? 0,
    qr_payload: initial.qr_payload ?? null,
    memo: initial.memo ?? ''
  })
  const create = useCreateItem()
  const update = useUpdateItem()
  const del = useDeleteItem()

  async function save() {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('자재 코드와 이름은 필수입니다.')
      return
    }
    try {
      const payload = { ...form, qr_payload: form.qr_payload ?? form.code }
      if (isEdit && initial.id) {
        await update.mutateAsync({ id: initial.id, ...payload })
      } else {
        await create.mutateAsync(payload)
      }
      toast.success(isEdit ? '수정되었습니다.' : '추가되었습니다.')
      onClose()
    } catch (e: any) {
      toast.error('저장 실패', { description: e?.message })
    }
  }

  async function remove() {
    if (!initial.id) return
    if (!confirm('정말 삭제할까요? 재고/이력이 있으면 실패합니다.')) return
    try {
      await del.mutateAsync(initial.id)
      toast.success('삭제되었습니다.')
      onClose()
    } catch (e: any) {
      toast.error('삭제 실패', { description: e?.message })
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-end sm:items-center justify-center safe-bottom overflow-y-auto">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-3 max-h-[90vh] overflow-y-auto">
        <h2 className="font-bold text-lg">{isEdit ? '자재 수정' : '자재 추가'}</h2>

        <div>
          <label className="label">자재 코드</label>
          <input className="field" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        </div>
        <div>
          <label className="label">자재명</label>
          <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">규격</label>
            <input className="field" value={form.spec} onChange={(e) => setForm({ ...form, spec: e.target.value })} />
          </div>
          <div>
            <label className="label">단위</label>
            <input className="field" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">수종</label>
            <input className="field" value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} />
          </div>
          <div>
            <label className="label">색상/패턴</label>
            <input className="field" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="label">박스당 수량</label>
            <input className="field" inputMode="decimal" value={form.qty_per_box}
              onChange={(e) => setForm({ ...form, qty_per_box: Number(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="label">박스당 면적</label>
            <input className="field" inputMode="decimal" value={form.area_per_box}
              onChange={(e) => setForm({ ...form, area_per_box: Number(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="label">안전재고</label>
            <input className="field" inputMode="decimal" value={form.safety_stock}
              onChange={(e) => setForm({ ...form, safety_stock: Number(e.target.value) || 0 })} />
          </div>
        </div>
        <div>
          <label className="label">비고</label>
          <input className="field" value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} />
        </div>

        <div className="flex gap-2 pt-2">
          {isEdit && (
            <button className="btn-secondary text-red-600" onClick={remove}>
              <Trash2 className="w-4 h-4 mr-1" /> 삭제
            </button>
          )}
          <button className="btn-secondary flex-1" onClick={onClose}>취소</button>
          <button className="btn-primary flex-1" onClick={save}>저장</button>
        </div>
      </div>
    </div>
  )
}
