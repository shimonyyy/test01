# 배포 가이드 (Supabase + Vercel)

## 1. Supabase 프로젝트

### 1.1 생성
1. https://supabase.com 에서 새 프로젝트를 만듭니다.
2. Project Settings → API 에서 `Project URL` 과 `anon` 키를 복사합니다.
3. Project Settings → API → JWT Settings 에서 토큰 만료 시간을 권장값으로 둡니다.

### 1.2 마이그레이션 실행
다음을 **순서대로** SQL Editor에서 실행합니다.
1. `supabase/migrations/0001_init.sql` — 테이블/시드
2. `supabase/migrations/0002_rls.sql` — RLS · `handle_new_user` 트리거
3. `supabase/migrations/0003_rpc.sql` — `record_inbound` / `record_outbound` / `record_transfer`
4. `supabase/migrations/0004_storage.sql` — `transaction-photos` 버킷 + RLS
5. `supabase/migrations/0005_admin.sql` — 관리자 RPC (`bulk_*`, `set_user_role`)

> Supabase CLI를 사용하는 경우:
> ```bash
> supabase link --project-ref <ref>
> supabase db push
> ```

### 1.3 첫 관리자 지정
SQL Editor에서 본인 계정을 admin으로 승격:
```sql
update public.profiles
set role = 'admin', is_approved = true
where email = 'your@email.com';
```

### 1.4 Auth 설정
- Authentication → URL Configuration → **Site URL** 에 Vercel 배포 URL 입력
- Authentication → Email Templates 에서 한국어 템플릿으로 교체 (선택)
- 가입 승인 정책을 도입할 경우 `handle_new_user` 함수에서 기본값을 `is_approved = false` 로 바꾸세요.

---

## 2. Vercel 배포

### 2.1 GitHub 연결
1. Vercel 대시보드에서 `Add New → Project` → GitHub 저장소 선택
2. Framework Preset: **Vite** (자동 감지)
3. Build Command: `npm run build` (기본값)
4. Output Directory: `dist`

### 2.2 환경 변수
Project Settings → Environment Variables 에 다음을 입력:
- `VITE_SUPABASE_URL` = Supabase Project URL
- `VITE_SUPABASE_ANON_KEY` = anon key

### 2.3 도메인 / PWA
- Custom Domain 연결 후 HTTPS가 자동 적용됩니다 (PWA에 HTTPS 필수).
- 배포 후 `/manifest.webmanifest` 와 `/sw.js` 가 정상 응답하는지 확인합니다.

### 2.4 캐시
`vercel.json` 에 다음이 설정되어 있습니다:
- `sw.js`, `manifest.webmanifest`: `max-age=0, must-revalidate`
- `/assets/*`: `max-age=31536000, immutable`

---

## 3. 운영 체크리스트

| 항목 | 비고 |
|------|------|
| 첫 admin 계정 지정 | 본 문서 §1.3 |
| 위치(창고) 시드 확인 | `0001_init.sql`이 하남창고/용인창고를 등록 |
| 자재 마스터 Import | 관리자 화면 `/import` |
| 초기 재고 Import | 자재 등록 후 진행 |
| Storage 버킷 RLS | `0004_storage.sql` 적용 여부 |
| Realtime 활성화 | Supabase 기본값으로 활성, Publication 필요 시 `supabase_realtime` 에 테이블 추가 |
| 모바일 PWA 설치 | iOS는 Safari + "홈 화면에 추가" 필수 |

---

## 4. 향후 작업

### 4.1 Web Push (서버 측 전송)
- VAPID 키 쌍 생성 후 Supabase Edge Function 작성:
  - subscribe: 클라이언트에서 받은 `PushSubscription` 을 `profiles.push_subscription` 에 저장
  - send: 안전재고 미달 트리거 또는 Cron으로 알림 발송 (`web-push` npm 패키지)
- 클라이언트에서는 `navigator.serviceWorker.register` + `pushManager.subscribe` 호출 (현재 `SettingsPage` 에 권한 요청까지만 구현됨)

### 4.2 WebAuthn (생체 로그인)
- Supabase Auth MFA — Factor 활용
- 별도 마이그레이션과 클라이언트 등록 화면 필요

### 4.3 GitHub Actions
- `.github/workflows/deploy.yml` 에서 `supabase db push` 자동화 가능 (Supabase Access Token 필요)
