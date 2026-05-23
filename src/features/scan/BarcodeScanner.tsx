import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

// 카메라 + BarcodeDetector API 기반 스캐너.
// iOS Safari 등 미지원 환경에서는 안내를 띄우고 수동 입력으로 fallback.

type DetectedCode = { rawValue: string }

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { BarcodeDetector?: any }
}

export default function BarcodeScanner({
  onDetect,
  onClose
}: {
  onDetect: (value: string) => void
  onClose: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [manualValue, setManualValue] = useState('')
  const [supported, setSupported] = useState<boolean>(false)
  const stopRef = useRef<() => void>(() => {})

  useEffect(() => {
    let cancelled = false
    let stream: MediaStream | null = null

    async function start() {
      const isSupported = typeof window !== 'undefined' && 'BarcodeDetector' in window
      setSupported(isSupported)
      if (!isSupported) {
        setError('이 브라우저는 자동 스캔을 지원하지 않습니다. 코드를 직접 입력해 주세요.')
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        const detector = new window.BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e']
        })
        let active = true
        const tick = async () => {
          if (!active || !videoRef.current) return
          try {
            const codes: DetectedCode[] = await detector.detect(videoRef.current)
            if (codes.length > 0) {
              active = false
              onDetect(codes[0].rawValue)
              return
            }
          } catch {
            // ignore single-frame errors
          }
          requestAnimationFrame(tick)
        }
        tick()
        stopRef.current = () => { active = false }
      } catch (e: any) {
        setError(e?.message ?? '카메라를 사용할 수 없습니다.')
      }
    }
    start()
    return () => {
      cancelled = true
      stopRef.current()
      if (stream) stream.getTracks().forEach((t) => t.stop())
    }
  }, [onDetect])

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col safe-top">
      <header className="flex items-center justify-between p-3">
        <p className="text-white font-semibold">자재 QR/바코드 스캔</p>
        <button onClick={onClose} className="text-white p-2"><X className="w-6 h-6" /></button>
      </header>

      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <video ref={videoRef} className="max-w-full max-h-full" playsInline muted />
        {supported && !error && (
          <div className="pointer-events-none absolute inset-x-12 top-1/2 -translate-y-1/2 aspect-square border-2 border-white/70 rounded-2xl" />
        )}
      </div>

      <div className="p-4 space-y-3 bg-black/80 text-white">
        {error && <p className="text-sm text-amber-300">{error}</p>}
        <div className="flex gap-2">
          <input
            className="field bg-white/90"
            placeholder="자재 코드 직접 입력"
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
          />
          <button
            className="btn-primary"
            onClick={() => manualValue.trim() && onDetect(manualValue.trim())}
          >
            확인
          </button>
        </div>
        <p className="text-xs text-white/60">
          코드는 자재 마스터의 <code>code</code> 필드와 일치해야 합니다.
        </p>
      </div>
    </div>
  )
}
