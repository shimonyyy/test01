export default function InboundPage() {
  return (
    <div className="p-4 space-y-4">
      <header className="pt-4">
        <h1 className="text-xl font-bold">입고 등록</h1>
        <p className="text-sm text-slate-500">Phase 2에서 구현됩니다.</p>
      </header>
      <section className="card text-sm text-slate-500 leading-relaxed">
        예정 동작: 위치(자동) → QR 스캔으로 자재 선택 → 수량 입력 → 사진 첨부 → 저장.
        오프라인 시 IndexedDB에 임시 저장 후 자동 동기화.
      </section>
    </div>
  )
}
