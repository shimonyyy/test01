# BERTI 원목마루 재고관리 시스템 PRD (v2)

> v1 대비 변경 요약
> - **모바일 우선(Mobile-First)** 으로 설계 철학 변경 (1차 사용자 = 현장 담당자)
> - **PWA / 오프라인 큐 / 바코드·QR 스캔 / 카메라 사진**을 핵심 기능으로 승격
> - 마일스톤(Phase) 재배치: 모바일 기본 인프라를 Phase 1에 포함
> - 비기능 요구사항에 모바일 성능/접근성/오프라인 항목 추가

---

## 1. 개요

### 1.1 프로젝트명
BERTI 원목마루 자재 재고관리 시스템

### 1.2 목적
여러 장소(현장별 야적장, 하남창고, 용인창고 등)에 분산된 원목마루 자재 재고를 통합 관리하고, 다수 사용자가 **현장(스마트폰)에서 즉시 입출고를 기록**할 수 있는 PWA 기반 웹앱을 구축한다.

### 1.3 배경
- 재고가 여러 장소에 분산되어 통합 관리 어려움
- 엑셀(`yymmdd_BERTI 재고리스트.xls`) 수동 관리로 실시간 공유 불가
- 입출고 이력 추적 어려움, 동시 작업 시 데이터 불일치
- **현장은 통신이 불안정하고 PC 사용이 어려움** → 오프라인 가능한 모바일 입력이 필수

### 1.4 설계 원칙
1. **모바일 우선**: 첫 화면부터 360px 폭에서 동작. 데스크톱은 확장형.
2. **현장 1탭 입력**: 입고/출고는 3탭 이내로 저장 완료.
3. **오프라인 우선**: 네트워크 단절 시에도 입력 가능, 복귀 시 자동 동기화.
4. **단일 진실 공급원**: 모든 재고 변동은 트랜잭션 RPC 통해서만 발생.

### 1.5 파일 관리 정보
- 파일 형식: `yymmdd_BERTI 재고리스트.xls`
- 저장 경로(참고용): `C:\Users\shimo\OneDrive\문서\0000.재고리스트`
- 기존 파일을 초기 마이그레이션 자료로 활용

---

## 2. 사용자

### 2.1 사용자 유형
| 구분 | 역할 | 권한 | 주 디바이스 |
|------|------|------|-------------|
| 관리자(Admin) | 시스템·사용자·마스터 관리 | 전체 권한 | PC + 모바일 |
| 일반사용자(User) | 입출고 등록, 재고 조회 | 조회/입력, 본인 등록건 수정 | **모바일 우선** |

### 2.2 사용자 시나리오
1. **현장 담당자(주 사용자)**: 스마트폰 홈화면 아이콘 → 생체 로그인 → 카메라로 QR 스캔 → 수량만 입력 → 저장. 통신이 끊겨도 입력 가능.
2. **창고 관리자**: 모바일/태블릿으로 창고별 현황 확인 및 입출고 등록.
3. **본사 관리자**: PC에서 전체 모니터링·보고서 출력.

---

## 3. 핵심 기능

### 3.1 인증 (Supabase Auth)
- **회원가입**: 이메일, 비밀번호, 이름, 소속(부서/현장), 연락처. 관리자 승인 옵션.
- **로그인**: 이메일+비번 / **매직링크** / **WebAuthn(생체)**
- **세션**: 자동 로그인 유지(리프레시 토큰), 앱 백그라운드 복귀 시 무중단
- **권한**: RBAC(admin/user) + Supabase Row Level Security
- **비번 재설정**: 모바일 메일 앱에서 그대로 열리는 딥링크

### 3.2 위치(창고) 관리
- 기본 위치: 하남창고, 용인창고
- 현장별 야적장 등록(현장명 + 주소)
- 관리자 권한 CRUD
- 위치별 재고 합계, 자재 종류/수량 조회
- **모바일 UX**: 마지막 선택 위치 자동 기억(현장 담당자는 보통 한 곳에서 일함)

### 3.3 자재 마스터
- 항목: 코드 / 자재명 / 규격 / 수종 / 색상·패턴 / 단위 / 박스당 수량·면적 / **안전재고** / 비고
- **QR 코드 자동 생성** + 라벨 출력 화면(관리자)
- 검색: 자재명/코드/규격
- 관리자 CRUD

### 3.4 입출고 관리
- **입고(Inbound)**: 일자, 위치, 자재, 수량, 거래처, 비고 + **사진 첨부**
- **출고(Outbound)**: 일자, 위치, 자재, 수량, 사용처/현장, 비고 + **사진 첨부**
- **이동(Transfer)**: 출발지·도착지 동시 처리
- **공통 자동 저장**: 입력자, 입력 일시, GPS(선택)
- **트랜잭션 RPC**: `record_inbound`/`record_outbound`/`record_transfer` — `transactions` insert + `inventory` upsert를 원자적 처리
- **검증**: 출고 시 현재고 미만 차단, 필수 항목 검증, 음수 재고 CHECK 제약
- **모바일 입력 최적화**:
  - 숫자 필드 `inputmode="decimal"` (숫자 키패드 강제)
  - 자재 선택: 풀스크린 BottomSheet + 최근/즐겨찾기 상단
  - 카메라 버튼 → **QR/바코드 스캔으로 자재 자동 선택**
  - 카메라 버튼 → **현장 사진 즉시 첨부** (`<input capture="environment">`)
  - 단일 스크롤 + sticky 저장 버튼, 탭 영역 ≥ 44pt
  - 저장 후 5초 "취소" 스낵바, 햅틱 피드백
  - 위치는 마지막값 자동 기본 선택

### 3.5 오프라인 입력 큐 (신규)
- 입력 폼은 IndexedDB(Dexie)에 즉시 저장 → 백그라운드에서 서버 동기화
- 출고는 "임시 저장"으로 표시, 온라인 복귀 시 서버 측 재고 검증 후 확정
- 미동기 건수 뱃지 표시, 실패 건은 사용자에게 명시적 알림

### 3.6 재고 현황 (Dashboard)
- **모바일 메인**: 하단 탭(대시보드 / 입고 / 출고 / 더보기)
  - 위치별 재고 카드(가로 스크롤)
  - 안전재고 미달 상단 알림
  - 최근 입출고 10건(카드 리스트)
- **데스크톱**: 사이드바 + 테이블 + 필터 패널
- **상세 조회**: 위치/자재 필터, 정렬, 검색, 안전재고 미달 강조
- 필터 상태는 URL 쿼리에 보존

### 3.7 이력 / Audit
- 기간(일/주/월/커스텀), 위치/자재/사용자/구분 필터
- 표시 항목: 일자, 구분, 위치, 자재, 수량, 입력자, 일시, 비고, 사진
- **Audit Trail**: 수정/삭제 시 `transaction_audits`에 OLD/NEW/actor/at 기록
- CSV 즉시 다운로드, 페이지네이션·가상화

### 3.8 보고서 / Excel I/O
- **Import**: 기존 `yymmdd_BERTI 재고리스트.xls` 업로드 → 매핑 → 검증/미리보기 → 일괄 insert (오류 리포트 다운로드)
- **Export**: 기존 양식 호환 `yymmdd_BERTI 재고리스트.xls` (파일명에 yymmdd 자동)
- 기간별 입출고 보고서(CSV/Excel)
- PDF 출력(선택)

### 3.9 실시간 동기화
- Supabase Realtime으로 `inventory`, `transactions` 변경을 TanStack Query 캐시에 머지
- 다중 사용자 동시 접속 시 3초 내 반영
- 페이지별 채널 분리(비용·노이즈 관리)

### 3.10 푸시 알림 (신규)
- **Web Push (VAPID) + Service Worker**
- 트리거: 안전재고 미달, 본인 등록건 반려, 관리자 승인
- iOS Safari는 16.4+ 홈화면 설치 시 가능 → 설치 안내 모달

---

## 4. 기술 스택

### 4.1 백엔드 / DB
- **Supabase**: PostgreSQL / Auth / RLS / Realtime / Storage(사진)
- 트랜잭션 RPC: `record_inbound`, `record_outbound`, `record_transfer`

### 4.2 프론트엔드
- **React + Vite + TypeScript**
- **PWA**: `vite-plugin-pwa` (Workbox)
- **UI**: Tailwind CSS + shadcn/ui
- **상태/데이터**: TanStack Query
- **오프라인 큐**: Dexie(IndexedDB)
- **폼**: react-hook-form + zod
- **반응형**: 모바일 우선(360px 기준), 데스크톱은 확장형

### 4.3 추가 라이브러리
- `xlsx`(SheetJS), `date-fns`
- 바코드: `BarcodeDetector` API + fallback `@zxing/browser`
- QR 생성: `qrcode`
- 가상화 리스트: `@tanstack/react-virtual`

---

## 5. 데이터베이스 스키마

### 5.1 테이블

#### `profiles`
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | auth.users 연결 |
| email | text | 이메일 |
| name | text | 이름 |
| department | text | 소속/부서 |
| phone | text | 연락처 |
| role | text | 'admin' / 'user' |
| is_approved | bool | 승인 여부 |
| default_location_id | uuid | 마지막/기본 위치 |
| push_subscription | jsonb | 웹푸시 구독 정보 |
| created_at | timestamptz | 가입 일시 |

#### `locations`
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| name | text | 위치명 |
| type | text | 'warehouse' / 'site' |
| address | text | 주소 |
| memo | text | 비고 |
| created_at | timestamptz | |

#### `items`
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| code | text UNIQUE | 자재 코드 |
| name | text | 자재명 |
| spec | text | 규격 |
| species | text | 수종 |
| color | text | 색상/패턴 |
| unit | text | 단위 |
| qty_per_box | numeric | 박스당 수량 |
| area_per_box | numeric | 박스당 면적 |
| **safety_stock** | numeric | 안전재고 |
| **qr_payload** | text | QR 페이로드(보통 code) |
| memo | text | |
| created_at | timestamptz | |

#### `inventory`
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| location_id | uuid (FK) | |
| item_id | uuid (FK) | |
| quantity | numeric CHECK (>=0) | 현재고 |
| updated_at | timestamptz | |

UNIQUE(`location_id`, `item_id`)

#### `transactions`
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| type | text | 'in'/'out'/'transfer' |
| location_id | uuid (FK) | 출고는 source |
| dest_location_id | uuid (FK) | transfer 전용 |
| item_id | uuid (FK) | |
| quantity | numeric | |
| transaction_date | date | |
| partner | text | 거래처/사용처 |
| memo | text | |
| **photo_urls** | jsonb | 첨부 사진 URL 배열 |
| **client_uuid** | uuid UNIQUE | 오프라인 중복 방지 idempotency key |
| **gps** | point | (선택) |
| created_by | uuid (FK) | profiles.id |
| created_at | timestamptz | |

#### `transaction_audits` (신규)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | bigserial (PK) | |
| transaction_id | uuid | |
| action | text | 'update'/'delete' |
| old_row | jsonb | |
| new_row | jsonb | |
| actor | uuid | |
| at | timestamptz | |

---

## 6. 화면 설계

### 6.1 모바일 IA (Information Architecture)
하단 탭 4개:
1. **대시보드**: 위치별 카드 / 안전재고 알림 / 최근 입출고
2. **입고**: 위치(자동) → 카메라(QR) → 수량 → 저장
3. **출고**: 위치(자동) → 카메라(QR) → 수량/사용처 → 저장
4. **더보기**: 재고 현황, 이력, (관리자) 자재/위치/사용자 관리, 보고서, 설정

### 6.2 데스크톱 IA
좌측 사이드바: 대시보드 / 재고 현황 / 입고 / 출고 / 이력 / 자재 / 위치 / 사용자 / 보고서

### 6.3 주요 화면
1. 로그인/회원가입 (이메일+비번 / 매직링크 / 생체)
2. 대시보드
3. 재고 현황 (필터/검색)
4. 입고 폼 / 출고 폼 / 이동 폼
5. 이력 + Audit
6. 자재 관리 (관리자, QR 라벨 출력 포함)
7. 위치 관리 (관리자)
8. 사용자 관리 (관리자)
9. 보고서 / Excel
10. 설정 (푸시 알림, 기본 위치, 테마, 글자 크기)
11. **오프라인 큐 화면**: 미동기 입력 목록 + 재시도/삭제

---

## 7. 비기능 요구사항

| 항목 | 내용 |
|------|------|
| **모바일** | PWA 설치 가능, 첫 로드 JS ≤ 200KB(gzip), Lighthouse PWA ≥ 90, 360px 폭 미깨짐 |
| **오프라인** | 입력 폼 100% 오프라인 가능, 온라인 복귀 시 자동 동기화, 중복 입력 방지(client_uuid) |
| 접근성 | WCAG AA, 다크모드, 큰 글씨 옵션, 색약 대비 안전재고 표시 |
| 보안 | Supabase Auth + RLS, HTTPS, 비번 해싱, 사진은 서명 URL |
| 성능 | 데이터 1만 건 1초 이내 조회, 리스트 가상화 |
| 가용성 | Supabase 클라우드, 24/7 |
| 사용성 | 한국어 UI, 입출고 3탭 이내 완료, 햅틱 피드백, 5초 취소 |
| 백업 | Supabase 자동 백업 + 정기 Excel 내보내기 |

---

## 8. 개발 단계 (재배치)

### Phase 1 — 기반 + 모바일 골격 (2주)
- Supabase 프로젝트, 스키마, RLS, `handle_new_user` 트리거
- Vite + TS + Tailwind + shadcn/ui 셋업
- **PWA 매니페스트 + Service Worker 기본 셋업**
- **모바일 우선 디자인 토큰, 하단 탭 네비**
- 로그인/회원가입 (이메일+비번, 매직링크)

### Phase 2 — 핵심 기능 + 현장 입력 (3주)
- 자재 마스터 / 위치 관리
- 입고/출고 RPC + 폼(모바일 우선)
- **QR/바코드 스캔으로 자재 자동 선택**
- **카메라 사진 첨부 + Storage 업로드**
- 대시보드 / 재고 현황
- **오프라인 입력 큐(Dexie) MVP**

### Phase 3 — 운영 (2주)
- 이력 + Audit Trail
- Excel Import/Export (기존 양식 호환)
- Realtime 동기화
- **Web Push 알림 (안전재고 미달)**
- **WebAuthn(생체) 로그인**

### Phase 4 — 마무리 (1주)
- 사용자/권한 관리, 가입 승인 토글
- 이동(Transfer) 등록
- E2E 테스트(Playwright + 모바일 에뮬레이션)
- 사용자 매뉴얼 + 배포 파이프라인

---

## 9. 마이그레이션 계획

### 9.1 기존 데이터
- `C:\Users\shimo\OneDrive\문서\0000.재고리스트`의 최신 파일을 기준으로 초기 데이터 생성
- 관리자 화면에서 Excel → DB 일괄 import (검증 리포트 제공)
- 마이그레이션 후 데이터 검증 절차 수행

### 9.2 호환성
- 기존 엑셀 양식과 동일한 형식으로 Export 지원 → 병행 운영 가능

---

## 10. 향후 확장

- 카카오톡/이메일 알림 연동
- 거래처/공급처 마스터, 발주 관리
- 통계 대시보드(월별 추이, 회전율)
- 다국어 지원
- 라벨 프린터 연동(블루투스)

---

## 11. 성공 지표 (KPI)

- 데이터 입력 누락률 50% 이상 감소
- **모바일에서 입출고 1건 등록 평균 시간 ≤ 15초**
- **오프라인 입력 동기화 성공률 ≥ 99%**
- 재고 조회 응답 시간 1초 이내
- 월별 활성 사용자 수 (MAU), 입출고 등록 처리 건수
- 사용자 만족도 정기 설문 (NPS)
