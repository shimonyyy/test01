# BERTI 원목마루 재고관리 시스템 — 개발 PLAN

> 근거 문서: `21a2630f-prd_____.md.md` (이하 "PRD")
> 작성일: 2026-05-23

이 문서는 PRD를 실행 가능한 개발 계획으로 분해한 것입니다. 4개의 스프린트(= PRD §8 Phase 1~4)로 구성하며, 각 스프린트는 **에픽 → 스토리 → 태스크 → 수용 기준(AC)** 순으로 정리합니다.

---

## 0. 산출물 요약

| 영역 | 결정 사항 |
|------|-----------|
| 프론트엔드 | React + Vite + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| 상태/데이터 | TanStack Query + Supabase JS Client |
| 폼 | react-hook-form + zod |
| 백엔드/DB | Supabase (Postgres + Auth + RLS + Realtime) |
| Excel I/O | SheetJS (`xlsx`) |
| 날짜 | `date-fns` |
| 배포 | Vercel(프론트), Supabase(백엔드) |
| 언어 | 한국어 UI, 코드/식별자는 영어 |

### 폴더 구조(예정)
```
/
├─ supabase/
│  ├─ migrations/           # SQL 마이그레이션 (스키마, RLS, RPC)
│  └─ seed/                 # 초기 데이터(창고 2곳 등)
├─ src/
│  ├─ app/                  # 라우팅, providers
│  ├─ features/
│  │  ├─ auth/
│  │  ├─ items/
│  │  ├─ locations/
│  │  ├─ inventory/
│  │  ├─ transactions/
│  │  └─ reports/
│  ├─ components/ui/        # shadcn 컴포넌트
│  ├─ lib/                  # supabaseClient, queryClient, utils
│  └─ pages/
└─ PLAN.md
```

---

## 1. 스프린트 1 — 기반 구축 (1~2주)

**목표**: 인증된 사용자가 로그인해 빈 대시보드까지 도달할 수 있는 최소 골격을 구축한다.

### EPIC 1-A. 프로젝트/툴체인 셋업
- **S1-A-1** Vite + React + TS + Tailwind + shadcn/ui 초기 세팅
  - 태스크: `npm create vite`, Tailwind 설치, shadcn init, ESLint/Prettier, `.env.example`
  - **AC**: `npm run dev` 시 첫 페이지 렌더, `npm run build` 통과, lint 통과.
- **S1-A-2** Supabase 프로젝트 생성 및 환경변수 연결
  - 태스크: `supabase` CLI 초기화, `SUPABASE_URL`/`SUPABASE_ANON_KEY` 주입, `src/lib/supabaseClient.ts`
  - **AC**: 클라이언트에서 `supabase.auth.getSession()` 호출 성공.

### EPIC 1-B. DB 스키마 & RLS
- **S1-B-1** 핵심 테이블 마이그레이션 (PRD §5)
  - 테이블: `profiles`, `locations`, `items`, `inventory`, `transactions`
  - 인덱스: `inventory(location_id, item_id)` UNIQUE, `transactions(transaction_date)`, FK 인덱스
  - **AC**: `supabase db push` 성공, 각 테이블 CRUD 가능.
- **S1-B-2** RLS 정책
  - `profiles`: 본인 row read/update, admin은 전체
  - `locations`/`items`: 인증 사용자 read, admin write
  - `inventory`: 인증 사용자 read, RPC를 통해서만 write
  - `transactions`: 인증 사용자 본인 insert, 본인 또는 admin update/delete
  - **AC**: 비인증 요청은 모두 거부, role별 SQL 테스트 케이스 통과.
- **S1-B-3** 사용자 자동 프로필 트리거
  - `auth.users` insert 시 `profiles` 자동 생성 (`handle_new_user` trigger)
  - **AC**: 회원가입 시 `profiles` row가 생성되며 기본 role='user'.

### EPIC 1-C. 인증 화면
- **S1-C-1** 회원가입 페이지 (이메일/비번/이름/소속/연락처)
  - **AC**: 이메일 형식 검증, 비번 8자 이상, 가입 후 인증메일 안내 토스트.
- **S1-C-2** 로그인/로그아웃 + 자동로그인 + 비번 재설정
  - **AC**: 새로고침 후 세션 유지, 잘못된 자격증명 메시지 표시.
- **S1-C-3** Auth Guard / 라우터 보호
  - **AC**: 비로그인 상태에서 보호 페이지 접근 시 `/login`으로 리다이렉트.

**스프린트 1 DoD**: 회원가입 → 로그인 → 빈 대시보드 진입 가능, RLS로 데이터 접근 차단 확인.

---

## 2. 스프린트 2 — 핵심 기능 (2~3주)

**목표**: 자재/창고 마스터 관리, 입출고 등록, 재고 현황 조회까지 운영 가능한 수준으로 완성.

### EPIC 2-A. 마스터 관리
- **S2-A-1** 위치(창고) 관리 CRUD (관리자 전용)
  - 기본 시드: 하남창고, 용인창고
  - **AC**: 목록/등록/수정/삭제, type(warehouse/site) 구분, 일반 사용자에게는 읽기 전용.
- **S2-A-2** 자재 마스터 CRUD (관리자 전용)
  - 컬럼: code, name, spec, species, color, unit, qty_per_box, area_per_box, memo
  - **AC**: code 유니크 검증, 검색(이름/코드/규격) 동작.

### EPIC 2-B. 입출고 등록
- **S2-B-1** 입고 폼
  - 필드: 일자, 위치, 자재(검색 가능 select), 수량, 거래처, 비고
  - 트랜잭션 RPC `record_inbound(...)` 호출 → `transactions` insert + `inventory` upsert(+quantity) 원자적 처리
  - **AC**: 저장 후 해당 위치의 재고가 즉시 증가, 입력자/일시 자동 저장.
- **S2-B-2** 출고 폼
  - 필드: 일자, 위치, 자재, 수량, 사용처/현장, 비고
  - RPC `record_outbound(...)`에서 현재고 < 출고수량이면 에러 반환
  - **AC**: 재고 부족 시 차단 메시지, 정상 시 재고 차감.
- **S2-B-3** 이동(Transfer) 등록 (선택, 시간 남으면)
  - RPC `record_transfer(from, to, item, qty)` — 두 inventory row 동시 갱신
  - **AC**: 출발지 감소·도착지 증가, 한쪽 실패 시 롤백.

### EPIC 2-C. 대시보드 & 재고 현황
- **S2-C-1** 메인 대시보드
  - 위치별 재고 합계 카드, 자재별 총수량 Top N, 최근 입출고 10건
  - **AC**: 페이지 진입 1초 내 렌더(1만 row 기준).
- **S2-C-2** 상세 재고 조회
  - 위치/자재 필터, 정렬, 검색, 안전재고 미달 강조(컬럼 `items.safety_stock` 추가)
  - **AC**: 필터·정렬 조합이 URL 쿼리에 반영, 새로고침 시 상태 유지.

**스프린트 2 DoD**: 실제 운영 워크플로우(입고→조회→출고→이력)가 한 사이클 동작.

---

## 3. 스프린트 3 — 부가 기능 (1~2주)

**목표**: 이력/보고서/실시간/마이그레이션으로 기존 엑셀 워크플로우 대체.

### EPIC 3-A. 이력 & 감사
- **S3-A-1** 입출고 이력 조회
  - 기간(일/주/월/커스텀), 위치, 자재, 사용자, 입출고 구분 필터
  - 페이지네이션 + CSV 즉시 다운로드
  - **AC**: 기간 1년 데이터 조회 시 2초 내 응답.
- **S3-A-2** 수정/삭제 Audit Trail
  - `transaction_audits` 테이블 + 트리거(`OLD`, `NEW`, `actor`, `action`, `at`)
  - **AC**: 모든 update/delete가 audit row를 남기고 관리자 화면에서 조회 가능.

### EPIC 3-B. Excel I/O
- **S3-B-1** 기존 `yymmdd_BERTI 재고리스트.xls` Import (관리자)
  - 업로드 → 시트 매핑 → 검증/미리보기 → 일괄 insert
  - **AC**: 1000행 import 30초 내, 오류행은 다운로드 가능한 리포트로 제공.
- **S3-B-2** Export (`yymmdd_BERTI 재고리스트.xls` 호환 양식)
  - **AC**: 기존 양식 셀 위치/헤더 일치, 파일명에 오늘 날짜(yymmdd) 자동.

### EPIC 3-C. 실시간 동기화
- **S3-C-1** Realtime 구독
  - `inventory`, `transactions` 변경을 TanStack Query 캐시에 머지
  - **AC**: 두 브라우저 동시 접속 시 한쪽 등록이 다른쪽 화면에 3초 내 반영.

**스프린트 3 DoD**: 기존 엑셀 → 시스템 마이그레이션 완료, 다중 사용자 동시 작업 검증.

---

## 4. 스프린트 4 — 마무리 (1주)

**목표**: 권한 관리/모바일/품질/문서까지 완성해 운영 투입.

### EPIC 4-A. 권한 관리
- **S4-A-1** 사용자 목록 & role 변경 (관리자)
  - **AC**: admin이 user→admin 승격 가능, 본인 강등 방지.
- **S4-A-2** 가입 승인 옵션(설정 토글)
  - **AC**: 토글 ON 시 `profiles.is_approved=false`인 사용자는 로그인 후 대기 화면 표시.

### EPIC 4-B. 모바일 반응형
- **S4-B-1** 입출고 폼 모바일 최적화 (큰 탭 영역, 숫자 키패드)
- **S4-B-2** 대시보드/현황 테이블 → 모바일 카드 뷰 전환
- **AC**: Chrome 모바일 에뮬레이터(iPhone 14 / Galaxy S22) 가로/세로에서 깨짐 없음.

### EPIC 4-C. 품질 & 문서
- **S4-C-1** E2E 시나리오 테스트 (Playwright): 로그인/입고/출고/이력
- **S4-C-2** 사용자 매뉴얼 (스크린샷 포함, `docs/USER_GUIDE.md`)
- **S4-C-3** 배포 파이프라인 정리 (Vercel 프리뷰, Supabase 마이그레이션 자동화)

**스프린트 4 DoD**: 운영 사용자 5명 베타 1주 사용 후 critical 버그 0건.

---

## 5. 리스크 & 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 기존 엑셀 양식 다양/비정형 | Import 실패율↑ | 샘플 파일 수집 → 매핑 규칙 사전 정의, 검증 리포트 제공 |
| 동시 입출고로 재고 음수 | 데이터 무결성 | 모든 입출고는 RPC(트랜잭션) + `quantity >= 0` CHECK |
| RLS 정책 누락 | 보안 사고 | 정책별 SQL 테스트, anon/user/admin 3개 키로 회귀 테스트 |
| OneDrive 경로 의존 | 환경 종속 | 경로는 안내 문구로만 노출, 실제 다운로드는 브라우저 표준 |
| Realtime 비용/노이즈 | 비용·성능 | 페이지별 채널 분리, 가시 영역만 구독 |

---

## 6. 다음 액션 (Sprint 1 Day 1)

1. Supabase 프로젝트 생성 후 `.env` 키 공유
2. `supabase/migrations/0001_init.sql` 작성 (테이블 5종 + 기본 인덱스)
3. `supabase/migrations/0002_rls.sql` 작성 (정책 + `handle_new_user` 트리거)
4. Vite 프로젝트 스캐폴드 & 로그인/회원가입 페이지 1차 구현
5. Vercel 프리뷰 연결

> 위 1~5 항목은 PR 단위로 분리 예정. 진행 승인 시 즉시 코드 작성에 착수합니다.
