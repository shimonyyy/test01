import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Loader2, ScanLine } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useLocations } from '@/features/locations/api'
import ItemPicker from '@/features/items/ItemPicker'
import BarcodeScanner from '@/features/scan/BarcodeScanner'
import PhotoCapture from '@/features/photos/PhotoCapture'
import { useRecordInbound, useRecordOutbound } from './api'
import { todayDateString } from '@/lib/format'
import { useAuth } from '@/features/auth/AuthProvider'
import { useProfile } from '@/features/auth/useProfile'
import { enqueue } from '@/features/offline/queue'
import type { Item, Location } from '@/lib/db.types'

type Kind = 'inbound' | 'outbound'

export default function TransactionForm({ kind }: { kind: Kind }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { data: locations } = useLocations()
  const inbound = useRecordInbound()
  const outbound = useRecordOutbound()

  const [clientUuid] = useState(() => crypto.randomUUID())
  const [locationId, setLocationId] = useState<string>('')
  const [item, setItem] = useState<Item | null>(null)
  const [quantity, setQuantity] = useState<string>('')
  const [partner, setPartner] = useState('')
  const [memo, setMemo] = useState('')
  const [date, setDate] = useState(todayDateString())
  const [photos, setPhotos] = useState<string[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)

  // 기본 위치: profile.default_location_id → 마지막 사용 → 첫 위치
  useEffect(() => {
    if (locationId) return
    if (profile?.default_location_id) setLocationId(profile.default_location_id)
    else if (locations && locations[0]) setLocationId(locations[0].id)
  }, [profile, locations, locationId])

  const submitting = inbound.isPending || outbound.isPending
  const title = kind === 'inbound' ? '입고 등록' : '출고 등록'

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
    if (!locationId) return toast.error('위치를 선택해 주세요.')
    if (!item) return toast.error('자재를 선택해 주세요.')
    const qty = Number(quantity)
    if (!Number.isFinite(qty) || qty <= 0) return toast.error('수량을 올바르게 입력해 주세요.')
    if (!user) return toast.error('로그인이 필요합니다.')

    const payload = {
      p_location_id: locationId,
      p_item_id: item.id,
      p_quantity: qty,
      p_transaction_date: date,
      p_partner: partner,
      p_memo: memo,
      p_photo_urls: photos,
      p_client_uuid: clientUuid
    }

    // 본인 default location 업데이트(다음 입력 시 자동선택)
    if (profile && profile.default_location_id !== locationId) {
      supabase.from('profiles').update({ default_location_id: locationId }).eq('id', profile.id).then(
        () => {},
        () => {}
      )
    }

    // 오프라인 시 큐로
    if (!navigator.onLine) {
      await enqueue({
        client_uuid: clientUuid,
        kind,
        payload,
        item_name: item.name,
        location_name: locations?.find((l) => l.id === locationId)?.name,
        quantity: qty
      })
      toast.success('오프라인 임시 저장됨', { description: '온라인 복귀 시 자동 동기화됩니다.' })
      navigator.vibrate?.(50)
      navigate('/', { replace: true })
      return
    }

    try {
      if (kind === 'inbound') await inbound.mutateAsync(payload)
      else await outbound.mutateAsync(payload)
      toast.success(kind === 'inbound' ? '입고 완료' : '출고 완료', {
        description: `${item.name} ${qty} ${item.unit}`
      })
      navigator.vibrate?.(50)
      navigate('/', { replace: true })
    } catch (e: any) {
      const msg = e?.message ?? '저장 실패'
      if (msg.includes('INSUFFICIENT_STOCK')) {
        toast.error('재고 부족', { description: '현재고 미만으로는 출고할 수 없습니다.' })
      } else {
        toast.error('저장 실패', { description: msg })
      }
    }
  }

  const currentLocation = useMemo<Location | null>(
    () => (locations?.find((l) => l.id === locationId) as Location) ?? null,
    [locations, locationId]
  )

  return (
    <div className="p-4 space-y-4 pb-32">
      <header className="pt-4">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-sm text-slate-500">필수 항목을 입력하고 저장하세요.</p>
      </header>

      <section className="card space-y-4">
        <div>
          <label className="label">위치</label>
          <select
            className="field appearance-none"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
          >
            {locations?.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.type === 'warehouse' ? '창고' : '현장'})
              </option>
            ))}
          </select>
          {currentLocation?.address && (
            <p className="text-xs text-slate-400 mt-1">{currentLocation.address}</p>
          )}
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
          {item && (
            <p className="text-xs text-slate-400 mt-1">
              {item.spec || '규격 없음'} · 단위 {item.unit}
            </p>
          )}
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
          <label className="label">{kind === 'inbound' ? '거래처' : '사용처/현장'} (선택)</label>
          <input className="field" value={partner} onChange={(e) => setPartner(e.target.value)} />
        </div>

        <div>
          <label className="label">비고 (선택)</label>
          <input className="field" value={memo} onChange={(e) => setMemo(e.target.value)} />
        </div>

        <div>
          <label className="label">사진 (선택)</label>
          {user ? (
            <PhotoCapture
              userId={user.id}
              clientUuid={clientUuid}
              value={photos}
              onChange={setPhotos}
            />
          ) : null}
        </div>
      </section>

      {/* sticky 저장 버튼 */}
      <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom))] inset-x-0 p-3 bg-white/95 backdrop-blur border-t border-slate-200">
        <div className="max-w-2xl mx-auto">
          <button onClick={save} disabled={submitting} className="btn-primary w-full text-base">
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {submitting ? '저장 중…' : kind === 'inbound' ? '입고 저장' : '출고 저장'}
          </button>
        </div>
      </div>

      {pickerOpen && (
        <ItemPicker
          onPick={(it) => { setItem(it); setPickerOpen(false) }}
          onClose={() => setPickerOpen(false)}
        />
      )}
      {scannerOpen && (
        <BarcodeScanner
          onDetect={handleScan}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  )
}

