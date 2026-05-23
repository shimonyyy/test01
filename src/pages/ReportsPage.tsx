import { useState } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useLocations } from '@/features/locations/api'
import {
  exportInventoryXlsx,
  exportTransactionsXlsx,
  type InventoryExportRow,
  type TransactionExportRow
} from '@/features/reports/excel'
import { fmtDate, fmtDateTime, todayDateString } from '@/lib/format'

function rangeDays(days: number) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10)
  }
}

export default function ReportsPage() {
  const { data: locations } = useLocations()
  const [locationId, setLocationId] = useState<string>('')
  const initial = rangeDays(30)
  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)
  const [busy, setBusy] = useState(false)

  async function downloadInventory() {
    setBusy(true)
    try {
      let q = supabase
        .from('inventory')
        .select(`
          quantity, updated_at,
          location:locations(name),
          item:items(code,name,spec,unit,safety_stock)
        `)
      if (locationId) q = q.eq('location_id', locationId)
      const { data, error } = await q
      if (error) throw error
      const rows: InventoryExportRow[] = (data ?? []).map((r: any) => ({
        위치: r.location?.name ?? '',
        자재코드: r.item?.code ?? '',
        자재명: r.item?.name ?? '',
        규격: r.item?.spec ?? '',
        단위: r.item?.unit ?? '',
        수량: Number(r.quantity),
        안전재고: Number(r.item?.safety_stock ?? 0),
        최종업데이트: fmtDateTime(r.updated_at)
      }))
      exportInventoryXlsx(rows)
      toast.success(`${rows.length}건 다운로드`)
    } catch (e: any) {
      toast.error('다운로드 실패', { description: e?.message })
    } finally {
      setBusy(false)
    }
  }

  async function downloadTransactions() {
    setBusy(true)
    try {
      let q = supabase
        .from('transactions')
        .select(`
          *,
          item:items(code,name,unit),
          location:locations!transactions_location_id_fkey(name),
          dest:locations!transactions_dest_location_id_fkey(name),
          author:profiles!transactions_created_by_fkey(name,email)
        `)
        .gte('transaction_date', from)
        .lte('transaction_date', to)
        .order('transaction_date', { ascending: false })
        .limit(10000)
      if (locationId) q = q.eq('location_id', locationId)
      const { data, error } = await q
      if (error) throw error
      const rows: TransactionExportRow[] = (data ?? []).map((tx: any) => ({
        일자: fmtDate(tx.transaction_date),
        등록일시: fmtDateTime(tx.created_at),
        구분: tx.type === 'in' ? '입고' : tx.type === 'out' ? '출고' : '이동',
        위치: tx.location?.name ?? '',
        도착지: tx.dest?.name ?? '',
        자재코드: tx.item?.code ?? '',
        자재명: tx.item?.name ?? '',
        수량: Number(tx.quantity),
        단위: tx.item?.unit ?? '',
        거래처사용처: tx.partner ?? '',
        비고: tx.memo ?? '',
        입력자: tx.author?.name || tx.author?.email || ''
      }))
      exportTransactionsXlsx(rows)
      toast.success(`${rows.length}건 다운로드`)
    } catch (e: any) {
      toast.error('다운로드 실패', { description: e?.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <header className="pt-4">
        <h1 className="text-xl font-bold">보고서 / Excel</h1>
        <p className="text-sm text-slate-500">기존 양식과 호환되는 .xlsx 형식으로 내보냅니다.</p>
      </header>

      <section className="card space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4" /> 재고 현황 스냅샷
        </h2>
        <div>
          <label className="label">위치</label>
          <select className="field" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
            <option value="">전체</option>
            {locations?.map((l) => (<option key={l.id} value={l.id}>{l.name}</option>))}
          </select>
        </div>
        <button className="btn-primary w-full" disabled={busy} onClick={downloadInventory}>
          <Download className="w-4 h-4 mr-2" /> 재고 다운로드 ({todayDateString()})
        </button>
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4" /> 기간별 입출고 이력
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">시작</label>
            <input type="date" className="field" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">종료</label>
            <input type="date" className="field" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <button className="btn-primary w-full" disabled={busy} onClick={downloadTransactions}>
          <Download className="w-4 h-4 mr-2" /> 입출고 다운로드
        </button>
      </section>
    </div>
  )
}
