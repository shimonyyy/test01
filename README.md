# BERTI 원목마루 재고관리 시스템

PRD v2(`PRD.md`)와 개발 PLAN(`PLAN.md`)에 기반한 **모바일 우선(PWA)** 재고관리 웹앱입니다.

**배포**: https://ai4ceo-f51z.vercel.app

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

## 구현 현황
- [x] **Phase 1** — Vite/TS/Tailwind/PWA, Supabase 클라이언트, 로그인/회원가입, RLS·트리거·입출고 RPC
- [x] **Phase 2** — 자재/위치 CRUD, 입출고 폼(QR 스캔·카메라 사진), 오프라인 큐(Dexie), 재고/이력
- [x] **Phase 3** — Realtime, 이력 필터+CSV, Excel Export/Import, 감사 로그
- [x] **Phase 4** — 사용자 관리·승인 게이트, 창고 간 이동, 설정, 사용자 매뉴얼, Vercel 설정, Playwright E2E 스캐폴드
- [ ] Web Push 서버 전송 (Edge Function 필요 — `docs/DEPLOY.md` §4.1 참조)
- [ ] WebAuthn 생체 로그인 (Supabase MFA Factor 연동 필요)

## 문서
- `docs/USER_GUIDE.md` — 사용자 매뉴얼
- `docs/DEPLOY.md` — Supabase·Vercel 배포 가이드

## 라이선스
사내 사용 (Proprietary)
