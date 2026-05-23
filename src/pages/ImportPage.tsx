import { useState } from 'react'
import { AlertCircle, CheckCircle2, FileUp, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { readSheet } from '@/features/reports/excel'
import { useIsAdmin } from '@/features/auth/useProfile'
import { useLocations } from '@/features/locations/api'
import { Navigate } from 'react-router-dom'

type Tab = 'items' | 'inventory'

type ParsedItemRow = {
  ok: boolean
  error?: string
  raw: Record<string, unknown>
  code: string
  name: string
  spec: string
  species: string
  color: string
  unit: string
  qty_per_box: number
  area_per_box: number
  safety_stock: number
  memo: string
}

type ParsedInventoryRow = {
  ok: boolean
  error?: string
  raw: Record<string, unknown>
  location_name: string
  location_id?: string
  item_code: string
  item_id?: string
  quantity: number
}

const ITEM_HEADER_MAP: Record<string, keyof Omit<ParsedItemRow, 'ok' | 'error' | 'raw'>> = {
  코드: 'code', 자재코드: 'code', code: 'code',
  자재명: 'name', 품목명: 'name', name: 'name',
  규격: 'spec', spec: 'spec',
  수종: 'species', species: 'species',
  색상: 'color', 패턴: 'color', color: 'color',
  단위: 'unit', unit: 'unit',
  박스당수량: 'qty_per_box', qty_per_box: 'qty_per_box',
  박스당면적: 'area_per_box', area_per_box: 'area_per_box',
  안전재고: 'safety_stock', safety_stock: 'safety_stock',
  비고: 'memo', memo: 'memo'
}

const INV_HEADER_MAP: Record<string, 'location_name' | 'item_code' | 'quantity'> = {
  위치: 'location_name', 창고: 'location_name', 현장: 'location_name', location: 'location_name',
  코드: 'item_code', 자재코드: 'item_code', code: 'item_code',
  수량: 'quantity', quantity: 'quantity', 재고: 'quantity'
}

function getField<T extends string>(
  row: Record<string, unknown>,
  map: Record<string, T>
): Partial<Record<T, unknown>> {
  const out: Partial<Record<T, unknown>> = {}
  for (const k of Object.keys(row)) {
    const key = k.replace(/\s+/g, '')
    const dest = map[key]
    if (dest) out[dest] = row[k]
  }
  return out
}

function toNum(v: unknown): number {
  if (typeof v === 'number') return v
  const n = Number(String(v ?? '').replace(/[, ]/g, ''))
  return Number.isFinite(n) ? n : 0
}

export default function ImportPage() {
  const isAdmin = useIsAdmin()
  if (!isAdmin) return <Navigate to="/" replace />

  const [tab, setTab] = useState<Tab>('items')

  return (
    <div className="p-4 space-y-4">
      <header className="pt-4">
        <h1 className="text-xl font-bold">Excel 일괄 Import</h1>
        <p className="text-sm text-slate-500">기존 `yymmdd_BERTI 재고리스트.xls` 를 업로드해 마이그레이션합니다.</p>
      </header>

      <div className="flex gap-2">
        <button
          className={`btn flex-1 ${tab === 'items' ? 'bg-brand-900 text-white' : 'bg-white border border-slate-200'}`}
          onClick={() => setTab('items')}
        >
          자재 마스터
        </button>
        <button
          className={`btn flex-1 ${tab === 'inventory' ? 'bg-brand-900 text-white' : 'bg-white border border-slate-200'}`}
          onClick={() => setTab('inventory')}
        >
          초기 재고
        </button>
      </div>

      {tab === 'items' ? <ItemsImporter /> : <InventoryImporter />}
    </div>
  )
}

function ItemsImporter() {
  const [rows, setRows] = useState<ParsedItemRow[] | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleFile(file: File) {
    try {
      const raw = await readSheet(file)
      const parsed: ParsedItemRow[] = raw.map((r) => {
        const f = getField(r, ITEM_HEADER_MAP)
        const code = String(f.code ?? '').trim()
        const name = String(f.name ?? '').trim()
        const ok = !!code && !!name
        return {
          ok,
          error: ok ? undefined : '자재코드/자재명이 비어있음',
          raw: r,
          code,
          name,
          spec: String(f.spec ?? ''),
          species: String(f.species ?? ''),
          color: String(f.color ?? ''),
          unit: String(f.unit ?? 'box') || 'box',
          qty_per_box: toNum(f.qty_per_box),
          area_per_box: toNum(f.area_per_box),
          safety_stock: toNum(f.safety_stock),
          memo: String(f.memo ?? '')
        }
      })
      setRows(parsed)
    } catch (e: any) {
      toast.error('파일 파싱 실패', { description: e?.message })
    }
  }

  async function confirm() {
    if (!rows) return
    const valid = rows.filter((r) => r.ok)
    if (valid.length === 0) return toast.error('등록할 행이 없습니다.')
    setBusy(true)
    try {
      const { data, error } = await supabase.rpc('bulk_upsert_items', {
        p_rows: valid.map((r) => ({
          code: r.code, name: r.name, spec: r.spec, species: r.species, color: r.color,
          unit: r.unit, qty_per_box: r.qty_per_box, area_per_box: r.area_per_box,
          safety_stock: r.safety_stock, memo: r.memo
        }))
      })
      if (error) throw error
      toast.success(`${data}건 등록/갱신되었습니다.`)
      setRows(null)
    } catch (e: any) {
      toast.error('등록 실패', { description: e?.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-4">
      <DropZone onFile={handleFile} hint="필수 컬럼: 자재코드, 자재명 · 선택: 규격, 수종, 색상, 단위, 박스당수량, 박스당면적, 안전재고, 비고" />
      {rows && (
        <>
          <Summary rows={rows} />
          <ItemsPreview rows={rows} />
          <button className="btn-primary w-full" disabled={busy} onClick={confirm}>
            <Upload className="w-4 h-4 mr-2" /> {busy ? '등록 중…' : '유효 행 일괄 등록'}
          </button>
        </>
      )}
    </section>
  )
}

function InventoryImporter() {
  const { data: locations } = useLocations()
  const [rows, setRows] = useState<ParsedInventoryRow[] | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleFile(file: File) {
    try {
      const raw = await readSheet(file)
      const locByName = new Map((locations ?? []).map((l) => [l.name, l.id]))
      // 자재 코드 → id 조회
      const codes = Array.from(new Set(
        raw.map((r) => String(getField(r, INV_HEADER_MAP).item_code ?? '').trim()).filter(Boolean)
      ))
      const { data: itemsData, error } = codes.length
        ? await supabase.from('items').select('id,code').in('code', codes)
        : { data: [] as { id: string; code: string }[], error: null }
      if (error) throw error
      const itemByCode = new Map((itemsData ?? []).map((it) => [it.code, it.id]))

      const parsed: ParsedInventoryRow[] = raw.map((r) => {
        const f = getField(r, INV_HEADER_MAP)
        const location_name = String(f.location_name ?? '').trim()
        const item_code = String(f.item_code ?? '').trim()
        const quantity = toNum(f.quantity)
        const location_id = locByName.get(location_name)
        const item_id = itemByCode.get(item_code)
        const errors: string[] = []
        if (!location_name) errors.push('위치 누락')
        else if (!location_id) errors.push('위치를 찾을 수 없음')
        if (!item_code) errors.push('자재코드 누락')
        else if (!item_id) errors.push('자재코드를 찾을 수 없음')
        if (quantity < 0) errors.push('수량 음수')
        return {
          ok: errors.length === 0,
          error: errors.join(', ') || undefined,
          raw: r,
          location_name,
          location_id,
          item_code,
          item_id,
          quantity
        }
      })
      setRows(parsed)
    } catch (e: any) {
      toast.error('파일 파싱 실패', { description: e?.message })
    }
  }

  async function confirm() {
    if (!rows) return
    const valid = rows.filter((r) => r.ok)
    if (valid.length === 0) return toast.error('등록할 행이 없습니다.')
    setBusy(true)
    try {
      const { data, error } = await supabase.rpc('bulk_set_inventory', {
        p_rows: valid.map((r) => ({
          location_id: r.location_id!,
          item_id: r.item_id!,
          quantity: r.quantity
        }))
      })
      if (error) throw error
      toast.success(`${data}건 등록/갱신되었습니다.`)
      setRows(null)
    } catch (e: any) {
      toast.error('등록 실패', { description: e?.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-4">
      <DropZone onFile={handleFile} hint="필수 컬럼: 위치(=창고명), 자재코드, 수량. 위치는 미리 등록되어 있어야 하고, 자재는 코드로 매칭됩니다." />
      {rows && (
        <>
          <Summary rows={rows} />
          <InventoryPreview rows={rows} />
          <button className="btn-primary w-full" disabled={busy} onClick={confirm}>
            <Upload className="w-4 h-4 mr-2" /> {busy ? '등록 중…' : '유효 행 일괄 등록 (덮어쓰기)'}
          </button>
        </>
      )}
    </section>
  )
}

function DropZone({ onFile, hint }: { onFile: (f: File) => void; hint: string }) {
  return (
    <label className="card flex flex-col items-center justify-center gap-2 p-6 cursor-pointer active:bg-slate-50">
      <FileUp className="w-8 h-8 text-slate-400" />
      <p className="font-medium">엑셀 파일 선택 (.xls / .xlsx)</p>
      <p className="text-xs text-slate-500 text-center">{hint}</p>
      <input
        type="file"
        accept=".xls,.xlsx"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
        }}
      />
    </label>
  )
}

function Summary<T extends { ok: boolean }>({ rows }: { rows: T[] }) {
  const ok = rows.filter((r) => r.ok).length
  const bad = rows.length - ok
  return (
    <div className="flex gap-3">
      <div className="card flex-1 flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        <div>
          <p className="text-xs text-slate-500">유효</p>
          <p className="text-xl font-bold">{ok}</p>
        </div>
      </div>
      <div className="card flex-1 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-rose-600" />
        <div>
          <p className="text-xs text-slate-500">오류</p>
          <p className="text-xl font-bold">{bad}</p>
        </div>
      </div>
    </div>
  )
}

function ItemsPreview({ rows }: { rows: ParsedItemRow[] }) {
  return (
    <ul className="space-y-1 max-h-[40vh] overflow-y-auto">
      {rows.slice(0, 200).map((r, i) => (
        <li key={i} className={`p-2 rounded-lg text-xs ${r.ok ? 'bg-emerald-50' : 'bg-rose-50'}`}>
          <p className="font-medium">{r.code || '(코드 없음)'} · {r.name || '(이름 없음)'}</p>
          <p className="text-slate-500">{r.spec} · {r.unit} · 박스당 {r.qty_per_box}</p>
          {!r.ok && <p className="text-rose-600 mt-0.5">{r.error}</p>}
        </li>
      ))}
      {rows.length > 200 && <li className="text-xs text-slate-400">… {rows.length - 200}건 생략</li>}
    </ul>
  )
}

function InventoryPreview({ rows }: { rows: ParsedInventoryRow[] }) {
  return (
    <ul className="space-y-1 max-h-[40vh] overflow-y-auto">
      {rows.slice(0, 200).map((r, i) => (
        <li key={i} className={`p-2 rounded-lg text-xs ${r.ok ? 'bg-emerald-50' : 'bg-rose-50'}`}>
          <p className="font-medium">{r.location_name} · {r.item_code} · {r.quantity}</p>
          {!r.ok && <p className="text-rose-600 mt-0.5">{r.error}</p>}
        </li>
      ))}
      {rows.length > 200 && <li className="text-xs text-slate-400">… {rows.length - 200}건 생략</li>}
    </ul>
  )
}
