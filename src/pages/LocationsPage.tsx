import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2, Warehouse, MapPin } from 'lucide-react'
import {
  useCreateLocation,
  useDeleteLocation,
  useLocations,
  useUpdateLocation
} from '@/features/locations/api'
import type { Location } from '@/lib/db.types'
import { useIsAdmin } from '@/features/auth/useProfile'

export default function LocationsPage() {
  const isAdmin = useIsAdmin()
  const { data, isLoading } = useLocations()
  const [editing, setEditing] = useState<Partial<Location> | null>(null)

  return (
    <div className="p-4 space-y-4">
      <header className="pt-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">위치(창고) 관리</h1>
          <p className="text-sm text-slate-500">총 {data?.length ?? 0}곳</p>
        </div>
        {isAdmin && (
          <button
            className="btn-primary"
            onClick={() => setEditing({ name: '', type: 'warehouse' })}
          >
            <Plus className="w-4 h-4 mr-1" /> 추가
          </button>
        )}
      </header>

      {isLoading && <p className="text-sm text-slate-500">불러오는 중…</p>}

      <ul className="space-y-3">
        {data?.map((loc) => (
          <li key={loc.id} className="card flex items-start gap-3">
            <div className="text-slate-400 pt-0.5">
              {loc.type === 'warehouse' ? <Warehouse className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{loc.name}</p>
              <p className="text-xs text-slate-500">
                {loc.type === 'warehouse' ? '창고' : '현장'}
                {loc.address ? ` · ${loc.address}` : ''}
              </p>
              {loc.memo && <p className="text-xs text-slate-400 mt-1">{loc.memo}</p>}
            </div>
            {isAdmin && (
              <button className="btn-ghost !min-h-0 !px-2" onClick={() => setEditing(loc)}>
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {editing && (
        <LocationEditor
          initial={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function LocationEditor({
  initial,
  onClose
}: {
  initial: Partial<Location>
  onClose: () => void
}) {
  const isEdit = !!initial.id
  const [form, setForm] = useState({
    name: initial.name ?? '',
    type: (initial.type ?? 'warehouse') as 'warehouse' | 'site',
    address: initial.address ?? '',
    memo: initial.memo ?? ''
  })
  const create = useCreateLocation()
  const update = useUpdateLocation()
  const del = useDeleteLocation()

  async function save() {
    if (!form.name.trim()) {
      toast.error('이름은 필수입니다.')
      return
    }
    try {
      if (isEdit && initial.id) {
        await update.mutateAsync({ id: initial.id, ...form })
      } else {
        await create.mutateAsync(form)
      }
      toast.success(isEdit ? '수정되었습니다.' : '추가되었습니다.')
      onClose()
    } catch (e: any) {
      toast.error('저장 실패', { description: e?.message })
    }
  }

  async function remove() {
    if (!initial.id) return
    if (!confirm('정말 삭제할까요? 연결된 재고가 있으면 실패합니다.')) return
    try {
      await del.mutateAsync(initial.id)
      toast.success('삭제되었습니다.')
      onClose()
    } catch (e: any) {
      toast.error('삭제 실패', { description: e?.message })
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-end sm:items-center justify-center safe-bottom">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-lg">{isEdit ? '위치 수정' : '위치 추가'}</h2>
        <div>
          <label className="label">이름</label>
          <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">구분</label>
          <div className="flex gap-2">
            {(['warehouse', 'site'] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`btn flex-1 ${form.type === t ? 'bg-brand-900 text-white' : 'bg-white border border-slate-200'}`}
                onClick={() => setForm({ ...form, type: t })}
              >
                {t === 'warehouse' ? '창고' : '현장'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">주소 (선택)</label>
          <input className="field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div>
          <label className="label">비고 (선택)</label>
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
