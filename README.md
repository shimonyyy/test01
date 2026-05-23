# BERTI 원목마루 재고관리 시스템

PRD v2(`PRD.md`)와 개발 PLAN(`PLAN.md`)에 기반한 **모바일 우선(PWA)** 재고관리 웹앱입니다.

## 기술 스택
- React 18 + Vite + TypeScript
- Tailwind CSS + lucide-react + sonner
- React Router · TanStack Query · react-hook-form + zod
- `vite-plugin-pwa` (오프라인 캐시 / 홈화면 설치)
- Supabase (Postgres + Auth + RLS + Realtime)

## 빠른 시작

### 1) 의존성 설치
```bash
npm install
```

### 2) 환경변수
```bash
cp .env.example .env
# .env 파일에 Supabase 프로젝트 키 입력
# VITE_SUPABASE_URL=https://<project-ref>.supabase.co
# VITE_SUPABASE_ANON_KEY=<anon-key>
```

### 3) Supabase 마이그레이션 실행
Supabase Studio → SQL Editor 에서 다음을 순서대로 실행:
1. `supabase/migrations/0001_init.sql` — 테이블/시드
2. `supabase/migrations/0002_rls.sql` — RLS · `handle_new_user` 트리거
3. `supabase/migrations/0003_rpc.sql` — `record_inbound` / `record_outbound` / `record_transfer`

또는 Supabase CLI 사용 시:
```bash
supabase link --project-ref <ref>
supabase db push
```

### 4) 개발 서버
```bash
npm run dev
# http://localhost:5173
```

### 5) 빌드
```bash
npm run build
npm run preview
```

## 폴더 구조
```
.
├─ supabase/migrations/   # SQL 마이그레이션
├─ src/
│  ├─ app/                # (예약)
│  ├─ components/layout/  # AppShell, BottomTabs
│  ├─ features/auth/      # AuthProvider, RequireAuth
│  ├─ lib/                # supabase, queryClient, utils
│  └─ pages/              # Login, Signup, Dashboard, Inbound, Outbound, More
├─ PRD.md
├─ PLAN.md
└─ README.md
```

## 현재 구현 범위 (Phase 1)
- [x] 프로젝트 셋업 (Vite + TS + Tailwind + PWA)
- [x] Supabase 클라이언트 + AuthProvider + 라우터 가드
- [x] 로그인 / 회원가입 / 매직링크
- [x] 모바일 하단 탭 네비 (대시보드/입고/출고/더보기)
- [x] DB 스키마 + RLS 정책 + 입출고 RPC
- [ ] 자재/위치 CRUD (Phase 2)
- [ ] 입출고 폼 + QR 스캔 + 사진 첨부 (Phase 2)
- [ ] 오프라인 큐 (Phase 2)
- [ ] Realtime / Web Push / Excel I/O (Phase 3)

## 라이선스
사내 사용 (Proprietary)
