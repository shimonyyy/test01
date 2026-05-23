import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Loader2, ScanLine } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useLocations } from '@/features/locations/api'
import ItemPicker from '@/features/items/ItemPicker'
import BarcodeScanner from '@/features/scan/BarcodeScanner'
import { todayDateString } from '@/lib/format'
import { useAuth } from '@/features/auth/AuthProvider'
import type { Item } from '@/lib/db.types'

export default function TransferForm() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()
  const { data: locations } = useLocations()

  const [clientUuid] = useState(() => crypto.randomUUID())
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [item, setItem] = useState<Item | null>(null)
  const [quantity, setQuantity] = useState('')
  const [memo, setMemo] = useState('')
  const [date, setDate] = useState(todayDateString())
  const [pickerOpen, setPickerOpen] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)

  useEffect(() => {
    if (!fromId && locations && locations[0]) setFromId(locations[0].id)
    if (!toId && locations && locations[1]) setToId(locations[1].id)
  }, [locations, fromId, toId])

  const transfer = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('record_transfer', {
        p_from_location_id: fromId,
        p_to_location_id: toId,
        p_item_id: item!.id,
        p_quantity: Number(quantity),
        p_transaction_date: date,
        p_memo: memo,
        p_client_uuid: clientUuid
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
    }
  })

  async function handleScan(code: string) {
    setScannerOpen(false)
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .or(`code.eq.${code},qr_payload.eq.${code}`)
      .maybeSingle()
    if (error) return toast.error('자재 조회 실패', { description: error.message })
    if (!data) return toast.error('자재를 찾을 수 없습니다.', { description: `코드: ${code}` })
    setItem(data as Item)
    toast.success(`${(data as Item).name} 선택됨`)
  }

  async function save() {
    if (!fromId || !toId) return toast.error('출발지/도착지를 선택해 주세요.')
    if (fromId === toId) return toast.error('출발지와 도착지가 같습니다.')
    if (!item) return toast.error('자재를 선택해 주세요.')
    const qty = Number(quantity)
    if (!Number.isFinite(qty) || qty <= 0) return toast.error('수량을 올바르게 입력해 주세요.')
    if (!user) return toast.error('로그인이 필요합니다.')
    try {
      await transfer.mutateAsync()
      toast.success('이동 완료', { description: `${item.name} ${qty} ${item.unit}` })
      navigator.vibrate?.(50)
      navigate('/', { replace: true })
    } catch (e: any) {
      const msg = e?.message ?? '저장 실패'
      if (msg.includes('INSUFFICIENT_STOCK')) {
        toast.error('재고 부족', { description: '출발지 재고가 부족합니다.' })
      } else if (msg.includes('SAME_LOCATION')) {
        toast.error('출발지와 도착지가 같습니다.')
      } else {
        toast.error('저장 실패', { description: msg })
      }
    }
  }

  const submitting = transfer.isPending

  const locationOptions = useMemo(
    () => locations?.map((l) => ({ id: l.id, label: `${l.name} (${l.type === 'warehouse' ? '창고' : '현장'})` })) ?? [],
    [locations]
  )

  return (
    <div className="p-4 space-y-4 pb-32">
      <header className="pt-4">
        <h1 className="text-xl font-bold">이동 등록</h1>
        <p className="text-sm text-slate-500">창고 간 자재 이동을 한 번에 처리합니다.</p>
      </header>

      <section className="card space-y-4">
        <div>
          <label className="label">출발지</label>
          <select className="field" value={fromId} onChange={(e) => setFromId(e.target.value)}>
            {locationOptions.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
          </select>
        </div>
        <div>
          <label className="label">도착지</label>
          <select className="field" value={toId} onChange={(e) => setToId(e.target.value)}>
            {locationOptions.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
          </select>
        </div>
        <div>
          <label className="label">자재</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="field text-left flex items-center justify-between flex-1"
            >
              <span className={item ? '' : 'text-slate-400'}>
                {item ? `${item.name} (${item.code})` : '자재 선택…'}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setScannerOpen(true)}
              aria-label="QR/바코드 스캔"
            >
              <ScanLine className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div>
          <label className="label">수량 ({item?.unit ?? '단위'})</label>
          <input
            className="field text-2xl tabular-nums"
            inputMode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label className="label">일자</label>
          <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="label">비고 (선택)</label>
          <input className="field" value={memo} onChange={(e) => setMemo(e.target.value)} />
        </div>
      </section>

      <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom))] inset-x-0 p-3 bg-white/95 backdrop-blur border-t border-slate-200">
        <div className="max-w-2xl mx-auto">
          <button onClick={save} disabled={submitting} className="btn-primary w-full text-base">
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {submitting ? '저장 중…' : '이동 저장'}
          </button>
        </div>
      </div>

      {pickerOpen && (
        <ItemPicker onPick={(it) => { setItem(it); setPickerOpen(false) }} onClose={() => setPickerOpen(false)} />
      )}
      {scannerOpen && (
        <BarcodeScanner onDetect={handleScan} onClose={() => setScannerOpen(false)} />
      )}
    </div>
  )
}
